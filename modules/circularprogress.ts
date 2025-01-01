import { property, register } from "astal";
import { Gtk, Widget } from "astal/gtk3";
import type Cairo from "cairo";

export interface CircularProgressProps extends Omit<Widget.DrawingAreaProps, "css" | "setup"> {
    value?: number;
    css?: string;
    setup?: (self: CircularProgress) => void;
}

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

const START_ANGLE = -Math.PI * 1.25;
const END_ANGLE = Math.PI * 0.25;
const LENGTH = END_ANGLE - START_ANGLE;

@register()
export default class CircularProgress extends Widget.DrawingArea {
    readonly #extraCss: string;

    #value: number;

    @property(Number)
    get value() {
        return this.#value;
    }

    set value(value: number) {
        value = clamp(value * 100, 0, 100);
        this.#value = value;
        this.css = `font-size: ${value}px; ${this.#extraCss}`;
        this.notify("value");
    }

    constructor(props: CircularProgressProps) {
        const { value = 0, css = "", setup, ...sProps } = props;
        super({ ...sProps, css: `font-size: ${clamp(value * 100, 0, 100)}px; ${css}` });

        this.#extraCss = css;
        this.#value = clamp(value * 100, 0, 100);

        this.connect("draw", (_, cr: Cairo.Context) => {
            const styleContext = this.get_style_context();
            const diameter = styleContext.get_property("min-height", Gtk.StateFlags.NORMAL) as number;
            const margin = styleContext.get_margin(Gtk.StateFlags.NORMAL);
            const width = diameter + margin.left + margin.right;
            const height = diameter + margin.top + margin.bottom;
            this.set_size_request(width, height);

            const progressValue = (styleContext.get_property("font-size", Gtk.StateFlags.NORMAL) as number) / 100;

            const thickness = styleContext.get_property("min-width", Gtk.StateFlags.NORMAL) as number;
            const radius = (diameter - thickness) / 2;
            const gap = (thickness / diameter) * 2.6;
            const centerX = diameter / 2 + margin.left;
            const centerY = diameter / 2 + margin.top;

            // Start arc
            if (progressValue - gap / LENGTH > 0) {
                const startX = centerX + Math.cos(START_ANGLE) * radius;
                const startY = centerY + Math.sin(START_ANGLE) * radius;
                const endAngle = START_ANGLE + LENGTH * progressValue - gap;
                const endX = centerX + Math.cos(endAngle) * radius;
                const endY = centerY + Math.sin(endAngle) * radius;

                cr.arc(centerX, centerY, radius + thickness / 2, START_ANGLE, endAngle);
                cr.arc(endX, endY, thickness / 2, 0, 0 - 0.01);
                cr.arcNegative(centerX, centerY, radius - thickness / 2, endAngle, START_ANGLE);
                cr.arc(startX, startY, thickness / 2, 0, 0 - 0.01);

                cr.clip();
                Gtk.render_background(styleContext, cr, 0, 0, width, height);
                cr.resetClip();
            }

            // Progress circle
            const progAngle = START_ANGLE + LENGTH * progressValue;
            const progX = centerX + Math.cos(progAngle) * radius;
            const progY = centerY + Math.sin(progAngle) * radius;
            cr.arc(progX, progY, thickness / 2, 0, Math.PI * 2);
            cr.clip();
            Gtk.render_background(styleContext, cr, 0, 0, width, height);
            cr.resetClip();

            // End arc
            if (progressValue + gap / LENGTH < 1) {
                const startAngle = START_ANGLE + LENGTH * progressValue + gap;
                const startX = centerX + Math.cos(startAngle) * radius;
                const startY = centerY + Math.sin(startAngle) * radius;
                const endX = centerX + Math.cos(END_ANGLE) * radius;
                const endY = centerY + Math.sin(END_ANGLE) * radius;

                cr.arc(centerX, centerY, radius + thickness / 2, startAngle, END_ANGLE);
                cr.arc(endX, endY, thickness / 2, 0, 0 - 0.01);
                cr.arcNegative(centerX, centerY, radius - thickness / 2, END_ANGLE, startAngle);
                cr.arc(startX, startY, thickness / 2, 0, 0 - 0.01);

                cr.clip();
                Gtk.render_background(styleContext, cr, 0, 0, width, height);
            }
        });

        // Setup after
        setup?.(this);
    }
}
