import { exec } from "astal";
import { App, Gtk } from "astal/gtk3";
import HardwareMonitor from "./modules/hardwaremonitor";
import Window from "./modules/window";

Gtk.init(null);

exec("sass style.scss /tmp/hw-mon.css");
App.apply_css("/tmp/hw-mon.css");

Gtk.IconTheme.get_default().append_search_path(`${SRC}/assets/icons`);

const win = (
    <Window title="hw-mon">
        <box vertical halign={Gtk.Align.CENTER} valign={Gtk.Align.CENTER}>
            <HardwareMonitor
                title="CPU"
                labelCmd="lscpu | grep 'Model name' | cut -f 2 -d : | awk '{$1=$1}1'"
                freqCmd="cat /proc/cpuinfo | grep MHz | awk '{s+=$4}END{print s/NR}'"
                utilCmd={"LANG=C top -bn1 | grep Cpu | sed 's/\\,/\\./g' | awk '{print $2}'"}
                tempCmd="LANG=C sensors | grep Core | tr '+°C' ' ' | awk '{s+=$3}END{print s/NR}'"
            />
            <HardwareMonitor
                title="GPU"
                labelCmd="lspci -mv | grep VGA -A 7 | grep ^Device: | cut -f 2- -d ':' | awk '{$1=$1}1'"
                freqCmd="cat /sys/class/drm/card1/device/hwmon/hwmon1/freq1_input"
                utilCmd="cat /sys/class/drm/card1/device/gpu_busy_percent"
                tempCmd="cat /sys/class/drm/card1/device/hwmon/hwmon1/temp1_input"
                freqTransform={out => parseInt(out) / 1_000_000}
                tempTransform={out => parseInt(out) / 1000}
            />
            <HardwareMonitor
                title="RAM"
                utilCmd={`LANG=C free | awk '/^Mem/ {printf("%.2f\\n", ($3/$2) * 100)}'`}
                tempCmd="LANG=C sensors | grep Composite | tr '+°C' ' ' | awk '{print $2}'"
            />
        </box>
    </Window>
);
win.show_all();
win.connect("delete-event", () => true); // Prevent closing window

Gtk.main();
