import { padDatePart } from "./padDatePart";

export function formatAlertDate(value: unknown) {
    const date = value ? new Date(String(value)) : new Date();
    if (Number.isNaN(date.getTime())) return formatAlertDate(new Date());
    return padDatePart(date.getDate()) + "/" + padDatePart(date.getMonth() + 1) + "/" + date.getFullYear();
}
