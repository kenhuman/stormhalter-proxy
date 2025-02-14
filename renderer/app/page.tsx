import ExpParser from '@/components/ExpParser';
import PacketMonitor from './components/PacketMonitor/index';
import MobList from './components/MobList';
import DrakeTrapFinder from './components/DrakeTrapFinder';

export default function Index() {
    return (
        <div
            role="tablist"
            className="tabs tabs-lifted bg-base-200 grid-cols-5"
        >
            <input
                type="radio"
                name="mainTabs"
                role="tab"
                className="tab"
                aria-label="EXP Parser"
                defaultChecked
            />
            <div
                role="tabpanel"
                className="tab-content bg-base-100 border-base-300 rounded-box p-6"
            >
                <ExpParser />
            </div>
            <input
                type="radio"
                name="mainTabs"
                role="tab"
                className="tab"
                aria-label="Packet Monitor"
            />
            <div
                role="tabpanel"
                className="tab-content bg-base-100 border-base-300 rounded-box p-6"
            >
                <PacketMonitor />
            </div>
            <input
                type="radio"
                name="mainTabs"
                role="tab"
                className="tab"
                aria-label="Mob List"
            />
            <div
                role="tabpanel"
                className="tab-content bg-base-100 border-base-300 rounded-box p-6"
            >
                <MobList />
            </div>
            <input type="radio" name="mainTabs" role="tab" className="tab" />
            <div
                role="tabpanel"
                className="tab-content bg-base-100 border-base-300 rounded-box p-6"
            >
                <DrakeTrapFinder />
            </div>
        </div>
    );
}
