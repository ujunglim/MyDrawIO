import { constants, PORT_TYPE } from "../Common/constants";
import Rect from "./Rect";

export default class Port extends Rect {
  constructor(type, x, y, parent) {
    super(x, y, constants.PORT_SIZE, constants.PORT_SIZE);
    // this.pos from Rect represent the local position inside its parent
    this.type = type;
    this.parent = parent;
    this.color = this.type === PORT_TYPE.LINE ? "lightblue" : "#2f9afb";

    if (this.parent) {
      this.updatePos();
    } else {
      this.globalPos = this.pos;
    }
  }

  // update port's global position in canvas (parent pos + local pos)
  updatePos() {
    this.globalPos = this.parent.shape.pos.plus(this.pos);
  }

  contain(point) {
    const { x, y } = this.globalPos;
    return (
      x < point.x && point.x < x + this.w && y < point.y && point.y < y + this.h
    );
  }
}
