import { sendMessage } from '../../sendMessage';

export default class ExperienceParser {
    private sessionStartTime: Date = new Date();
    private experience: Map<Date, number> = new Map<Date, number>();
    private sessionTotalExperience: number = 0;
    private expPerHour: number = 0;

    public resetData = (): void => {
        this.sessionStartTime = new Date();
        this.experience = new Map<Date, number>();
        this.sessionTotalExperience = 0;
        this.expPerHour = 0;
    };

    public parseMessage = (data: string[]): void => {
        const exp = +data[0];
        this.experience.set(new Date(), exp);
        this.sessionTotalExperience += exp;
        const ONE_HOUR = 60 * 60 * 1000;
        let earliest = new Date();
        for (const d of this.experience.keys()) {
            if (Date.now() - d.getTime() > ONE_HOUR) {
                this.experience.delete(d);
            } else {
                if (d < earliest) {
                    earliest = d;
                }
            }
        }
        let acc = 0;
        this.experience.forEach((v) => (acc += v));
        const timeSpan = Date.now() - earliest.getTime();
        const expPerTime = acc / timeSpan;
        const expPerHour = Math.floor(expPerTime * 60 * 60 * 1000);
        this.expPerHour = expPerHour;
        this.sendData();
    };

    private sendData = (): void => {
        sendMessage(
            'expParser',
            JSON.stringify({
                sessionStartTime: this.sessionStartTime,
                expPerHours: this.expPerHour,
                sessionTotalExperience: this.sessionTotalExperience,
            }),
        );
    };
}
