import { DataType, int } from "../src/DataType";

export const Frame = new DataType({ data: { header: int, data: int }, name: 'Frame' });
export const Ack = new DataType({ data: { header: int }, name: 'Ack' });