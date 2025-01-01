import { bind, exec, register, Variable } from "astal";
import { Gtk, Widget } from "astal/gtk3";
import Cairo from "cairo";
import PangoCairo from "gi://PangoCairo";
import CircularProgress from "./circularprogress";

export interface ResourceIndicatorProps extends Widget.OverlayProps {
    title: string;
    command: string;
    unit: string;
    titlePosition?: Position;
    transform?: (out: string) => number;
}

export enum Position {
    LEFT = 0.75,
    TOP = 0.5,
    RIGHT = 0.25,
}

@register()
export default class ResourceIndicator extends Widget.Overlay {
    constructor(props: ResourceIndicatorProps) {
        const { title, command, unit, titlePosition = Position.LEFT, transform = parseFloat, ...sProps } = props;
        super(sProps);

        const pollVar = Variable(0).poll(5000, () => transform(exec(["bash", "-c", command])));

        const progress = (
            <CircularProgress
                className="resource-indicator-progress"
                css={`
                    background-image: url("${SRC}/assets/conic-gradient.png");
                `}
                setup={self => self.hook(pollVar, (self, value) => (self.value = value / 100))}
            />
        );
        this.add_overlay(
            <box halign={Gtk.Align.CENTER} valign={Gtk.Align.END} className="resource-indicator-progress-wrapper">
                {progress}
            </box>
        );

        this.add_overlay(
            <label
                halign={Gtk.Align.CENTER}
                valign={Gtk.Align.CENTER}
                className="resource-indicator-value"
                label={bind(pollVar).as(v => String(Math.round(v)))}
            />
        );

        this.add_overlay(
            <label halign={Gtk.Align.CENTER} valign={Gtk.Align.END} className="resource-indicator-unit" label={unit} />
        );

        this.add(
            <drawingarea
                className="resource-indicator-title"
                setup={self =>
                    self.connect("draw", (self, cr: Cairo.Context) => {
                        const layout = self.create_pango_layout(title);
                        const [width, height] = layout.get_pixel_size();

                        const size =
                            (progress.get_style_context().get_property("min-height", Gtk.StateFlags.NORMAL) as number) +
                            height * 2;
                        self.set_size_request(size, size - height);
                        const radius = size / 2;

                        const startAngle = -Math.PI * titlePosition - width / (radius * 0.95) / 2;

                        const colour = self.get_style_context().get_color(Gtk.StateFlags.NORMAL);
                        cr.setSourceRGBA(colour.red, colour.green, colour.blue, colour.alpha);
                        cr.setAntialias(Cairo.Antialias.BEST);

                        let charWidth = 0;
                        for (const letter of title) {
                            layout.set_text(letter, -1);
                            const width = layout.get_pixel_size()[0];
                            const angle = startAngle + charWidth;
                            charWidth += width / (radius * 0.95);
                            const x = radius + radius * Math.cos(angle);
                            const y = radius + radius * Math.sin(angle);
                            cr.save();
                            cr.translate(x, y);
                            cr.rotate(angle + Math.PI / 2);
                            PangoCairo.show_layout(cr, layout);
                            cr.restore();
                        }
                    })
                }
            />
        );

        this.connect("destroy", () => pollVar.drop());
    }
}
