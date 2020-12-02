import {EditorView, Decoration, DecorationSet, WidgetType, Range} from "@codemirror/next/view"
import {basicSetup} from "@codemirror/next/basic-setup"
import {EditorState, StateEffect, StateField} from "@codemirror/next/state"

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

class InlineWidget extends WidgetType {
  constructor(readonly name: string) { super() }
  ignoreEvent(e: Event) { console.log('ignoreEvent', {event: e}); return false }
  eq(other: InlineWidget) { return this.name == other.name }
  toDOM() {
    let elt = document.createElement("div")
    elt.setAttribute("data-name", this.name)
    elt.style.backgroundColor = "pink"
    elt.style.display = "inline-block"
    elt.innerText = this.name
    return elt
  }
}

function br(from: number, to: number, name = "r", inclusive = true) {
  return Decoration.replace({widget: new InlineWidget(name), inclusive}).range(from, to)
}

const decoView = (label: string, doc: string, decorations: Array<any>) => {
  const p = document.createElement("p"),
      editor = document.createElement("div")
  p.innerHTML = label
  p.style.whiteSpace = "pre-wrap"
  document.body.appendChild(p)
  document.body.appendChild(editor)
  new EditorView({state: EditorState.create({doc: doc, extensions: [basicSetup, decos(Decoration.set(decorations))]}), parent: editor})
}

decoView(
    "problem: cursor is drawn in front of the widget, even when moved past it.\n" +
    "1. start at beginning of doc\n" +
    "2. press <b>right arrow</b> once - nothing happens \n" +
    "3. press <b>right arrow</b> again - cursor moves to line 2\n" +
    "4. now try from end of doc, moving left (cursor skips to beginning of widget)",
    "1\n2",
    [br(0, 1, "A")])

decoView(
    "start from beginning of doc and press <b>right arrow</b> repeatedly:\n" +
    "1. cursor moves past widget\n" +
    "2. cursor stays at end\n" +
    "3. cursor moves back to beginning of doc\n" +
    "4 & more. cursor stays at beginning of doc",
    "123",
    [br(0, 3, "A")])