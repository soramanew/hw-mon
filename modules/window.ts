import { register } from "astal";
import { astalify, Gtk, type ConstructProps } from "astal/gtk3";

@register()
export default class Window extends astalify(Gtk.Window) {
    constructor(props: ConstructProps<Window, Gtk.Window.ConstructorProps>) {
        super(props as any);
    }
}
