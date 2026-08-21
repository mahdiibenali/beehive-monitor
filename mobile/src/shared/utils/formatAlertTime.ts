import { padDatePart } from "./padDatePart";

export function formatAlertTime(value: unknown) {
    const date = value ? new Date(String(value)) : new Date();
    if (Number.isNaN(date.getTime())) return formatAlertTime(new Date());
    return padDatePart(date.getHours()) + ":" + padDatePart(date.getMinutes());
}
