import {EditorView, Decoration, DecorationSet, WidgetType, Range} from "@codemirror/next/view"
import {basicSetup} from "@codemirror/next/basic-setup"
import {EditorState, StateEffect, StateField} from "@codemirror/next/state"
import {html} from "@codemirror/next/lang-html"

//////////////////////////////////////////////////
// Copied from test-draw-decoration.ts

const filterDeco = StateEffect.define<(from: number, to: number, spec: any) => boolean>()
const addDeco = StateEffect.define<Range<Decoration>[]>()

function decos(startState: DecorationSet = Decoration.none) {
  let field = StateField.define<DecorationSet>({
    create() { return startState },
    update(value, tr) {
      value = value.map(tr.changes)
      for (let effect of tr.effects) {
        if (effect.is(addDeco)) value = value.update({add: effect.value})
        else if (effect.is(filterDeco)) value = value.update({filter: effect.value})
      }
      return value
    },
    provide: [EditorView.decorations]
  })
  return [field]
}

class BlockWidget extends WidgetType {
  constructor(readonly name: string) { super() }
  ignoreEvent(e: Event) { console.log('ignoreEvent', {event: e}); return false }
  eq(other: BlockWidget) { return this.name == other.name }
  toDOM() {
    let elt = document.createElement("div")
    elt.setAttribute("data-name", this.name)
    elt.innerText = this.name
    return elt
  }
}

function br(from: number, to: number, name = "r", inclusive = false) {
  return Decoration.replace({widget: new BlockWidget(name), inclusive, block: true}).range(from, to)
}

//////////////////////////////////////////////////


//import {esLint} from "@codemirror/next/lang-javascript"
// @ts-ignore
//import Linter from "eslint4b-prebuilt"
//import {linter} from "@codemirror/next/lint"

//import {StreamSyntax} from "@codemirror/next/stream-syntax"
//import legacyJS from "@codemirror/next/legacy-modes/src/javascript"

let state = EditorState.create({doc: `<script>
  const {readFile} = require("fs");
  readFile("package.json", "utf8", (err, data) => {
    console.log(data);
  });
</script>
`, extensions: [
  basicSetup,
  html(),
  decos(Decoration.set([br(8, 8, "Block content - cannot select")]))
//  linter(esLint(new Linter)),
//  new StreamSyntax(legacyJS()).extension,
]})

;(window as any).view = new EditorView({state, parent: document.querySelector("#editor")!})
