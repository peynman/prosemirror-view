import Vue from "Vue"
import { DOMSerializer } from "prosemirror-model"

export default function VueDomRenderSpec(doc, structure, xmlNS = null) {
    if (typeof structure == "string")
        return {
            dom: doc.createTextNode(structure)
        };
    if (structure.nodeType != null) return {
        dom: structure
    };
    let tagName = structure[0],
        space = tagName.indexOf(" ");
    if (space > 0) {
        xmlNS = tagName.slice(0, space);
        tagName = tagName.slice(space + 1);
    }
    let contentDOM = null;
    let dom = null;
    let vue = false;
    if (xmlNS) {
        dom = doc.createElementNS(xmlNS, tagName);
    } else {
        if (self.editorComponents[tagName]) {
            const comClass = Vue.extend(self.editorComponents[tagName]);
            const comp = new comClass({
                propsData: structure[1].props
            });
            comp.$mount();
            dom = comp.$el;
            dom.editorComponentRef = comp;
            vue = true;
        } else {
            dom = doc.createElement(tagName);
        }
    }
    let attrs = structure[1],
        start = 1;
    if (
        attrs &&
        typeof attrs == "object" &&
        attrs.nodeType == null &&
        !Array.isArray(attrs)
    ) {
        start = 2;
        if (!vue) {
            for (let name in attrs)
                if (attrs[name] != null) {
                    let space = name.indexOf(" ");
                    if (space > 0)
                        dom.setAttributeNS(
                            name.slice(0, space),
                            name.slice(space + 1),
                            attrs[name]
                        );
                    else dom.setAttribute(name, attrs[name]);
                }
        }
    }
    for (let i = start; i < structure.length; i++) {
        let child = structure[i];
        if (child === 0) {
            if (i < structure.length - 1 || i > start)
                throw new RangeError(
                    "Content hole must be the only child of its parent node"
                );
            return {
                dom,
                contentDOM: dom
            };
        } else {
            let {
                dom: inner,
                contentDOM: innerContent
            } = DOMSerializer.renderSpec(doc, child, xmlNS);
            dom.appendChild(inner);
            if (innerContent) {
                if (contentDOM) throw new RangeError("Multiple content holes");
                contentDOM = innerContent;
            }
        }
    }
    return {
        dom,
        contentDOM
    };
};