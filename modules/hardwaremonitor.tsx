import { bind, exec, register, Variable } from "astal";
import { Gtk, Widget } from "astal/gtk3";
import ResourceIndicator, { Position } from "./resourceindicator";

export interface HardwareMonitorProps extends Widget.BoxProps {
    title: string;
    labelCmd?: string;
    freqCmd?: string;
    utilCmd: string;
    tempCmd: string;
    freqTransform?: (out: string) => number;
    utilTransform?: (out: string) => number;
    tempTransform?: (out: string) => number;
}

@register()
export default class HardwareMonitor extends Widget.Box {
    constructor(props: HardwareMonitorProps) {
        const {
            title,
            labelCmd,
            freqCmd,
            utilCmd,
            tempCmd,
            freqTransform = parseFloat,
            utilTransform = parseFloat,
            tempTransform = parseFloat,
            ...sProps
        } = props;
        sProps.className = "hardware-monitor";
        sProps.vertical = true;
        super(sProps);

        const lTitle = title.toLowerCase();

        const pollVar = freqCmd ? Variable(0).poll(5000, () => freqTransform(exec(["bash", "-c", freqCmd]))) : null;

        if (labelCmd)
            this.add(
                <label
                    halign={Gtk.Align.END}
                    className="hardware-monitor-label"
                    label={exec(["bash", "-c", labelCmd])}
                />
            );
        else this.add(<box />);

        this.add(
            <box>
                <box vertical valign={Gtk.Align.CENTER}>
                    <label className={`hardware-monitor-title hardware-monitor-${lTitle}-title`} label={title} />
                    {pollVar && (
                        <label
                            className={`hardware-monitor-freq hardware-monitor-${lTitle}-freq`}
                            label={bind(pollVar).as(v => `${Math.round(v)} Mhz`)}
                        />
                    )}
                    <icon
                        className={`hardware-monitor-icon hardware-monitor-${lTitle}-icon`}
                        icon={`hwmon-${lTitle}-symbolic`}
                    />
                </box>
                <ResourceIndicator
                    valign={Gtk.Align.CENTER}
                    title="UTILISATION"
                    command={utilCmd}
                    unit="%"
                    transform={utilTransform}
                />
                <ResourceIndicator
                    valign={Gtk.Align.CENTER}
                    title="TEMPERATURE"
                    command={tempCmd}
                    unit="°C"
                    titlePosition={Position.RIGHT}
                    transform={tempTransform}
                />
            </box>
        );
    }
}
