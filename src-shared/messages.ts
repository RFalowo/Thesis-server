import { Player, Email, Trial, DesignerType } from "./api";
import { IMessage } from "../src-client/StayAliveSocket";

export interface PlayerConnectedMessage
  extends IMessage<"PlayerConnected", Player> {
  type: "PlayerConnected";
  data: Player;
}

export interface PlayerMovedMessage extends IMessage<"PlayerMoved", Player> {
  type: "PlayerMoved";
  data: Player;
}

export interface SoundTrailRequest extends IMessage<"SoundRequest", Trial> {
  type: "SoundRequest";
  data: Trial;
}

export interface ThreeDTrailRequest extends IMessage<"ThreeDRequest", Trial> {
  type: "ThreeDRequest";
  data: Trial;
}

export interface PlayerUpdate extends IMessage<"PlayerUpdate", Player> {
  type: "PlayerUpdate";
  data: Player;
}

export interface EmailSubmit extends IMessage<"EmailSubmit", Email> {
  type: "EmailSubmit";
  data: Email;
}

export interface GetOrder extends IMessage<"GetOrd", number> {
  type: "GetOrd";
  data: null;
}
// user defined type guard
export const isGetOrder = (value: unknown): value is GetOrder => {
  const getOrder = value as GetOrder;
  return (
    getOrder !== undefined &&
    getOrder.type === "GetOrd" &&
    getOrder.data === null
  );
};

export interface Order extends IMessage<"Ord", DesignerType> {
  type: "Ord";
  data: DesignerType;
}

export type AppMessage =
  | PlayerConnectedMessage
  | PlayerMovedMessage
  | PlayerUpdate
  | EmailSubmit
  | GetOrder
  | Order;
