import { constants } from "../Common/constants";
import Line from "../Model/Line";
import Rect from "../Model/Rect";
import Vec2 from "../Model/Vec2";
import CanvasViewInstance from "../View/CanvasView";
import DrawControllerInstance from "./DrawController";

export default class InputManager {
  constructor(controller) {
    this.controller = controller;
    this.isDragging = false;
    this.isLining = false;
    this.lineStartPort = null;
    this.bindedHandleMousedown = this.handleMousedown.bind(this);
    this.bindedHandleMouseUp = this.handleMouseUp.bind(this);
    this.bindedHandleMouseMove = this.handleMouseMove.bind(this);
    this.bindedHandleKeyDown = this.handleKeyDown.bind(this);
  }

  addEventListeners() {
    const canvas = CanvasViewInstance.canvas;
    canvas.addEventListener("mousedown", this.bindedHandleMousedown);
    canvas.addEventListener("mouseup", this.bindedHandleMouseUp);
    canvas.addEventListener("mousemove", this.bindedHandleMouseMove);
    window.addEventListener("keydown", this.bindedHandleKeyDown);
  }

  removeEventListeners() {
    const canvas = CanvasViewInstance.canvas;
    canvas.removeEventListener("mousedown", this.bindedHandleMousedown);
    canvas.removeEventListener("mouseup", this.bindedHandleMouseUp);
    canvas.removeEventListener("mousemove", this.bindedHandleMouseMove);
    window.removeEventListener("keydown", this.bindedHandleKeyDown);
  }

  // create vector of mouse x, y
  getMousePos(e) {
    return new Vec2(e.clientX - constants.PANEL_WIDTH, e.clientY);
  }

  handleMousedown(e) {
    const controller = this.controller;
    const rects = controller.rects;

    // const lastTargetRect = this.controller.targetRect;

    // clear previous targets
    for (const target of controller.targets) {
      target.isSelected = false;
    }
    controller.targets = [];

    this.startDragPoint = this.getMousePos(e);
    this.isDragging = true;

    for (let i = rects.length - 1; i >= 0; i--) {
      const rect = rects[i];
      // click port of rect
      for(const port of rect.ports) {
        if(port.contains(this.startDragPoint)) {
          console.log('lining')
          this.isLining = true;
          this.lineStartPort = port;
        }
      }

      // click rect
      if (rect.outerContains(this.startDragPoint)) {
        this.offset = rect.pos.minus(this.startDragPoint);
        // set targets
        controller.targets = [rect];
        rect.isSelected = true;
        // let target to be on top
        controller.toTop(i);
        controller.dataManager.delaySave();
        break;
      }
    }
    // draw when there is change
    // if (lastTargetRect !== controller.targetRect) {
    controller.draw();
    // }
  }

  handleMouseUp(e) {
    const currPos = this.getMousePos(e);
    // dragbox
    if (this.controller.dragBox) {
      for (const rect of this.controller.rects) {
        if (rect.isInsideDragBox()) {
          this.controller.targets.push(rect);
          rect.isSelected = true;
        }
      }
    }
    // console.log(this.controller.targets);

    // line
    if (this.isLining) {
      // find end port of line
      for (let i = this.controller.rects.length - 1; i >= 0; i--) {
        const rect = this.controller.rects[i];
        // find shape except itself
        if (!this.controller.targets[0].outerContains(currPos) && rect.outerContains(currPos)) {
          for (const port of rect.ports) {
            if (port.contains(currPos)) {
              DrawControllerInstance.lines.push(new Line(this.lineStartPort, port));
            }
          }
        }
      }
    }

    // reset
    this.startDragPoint = null;
    this.endDragPoint = null;
    this.isDragging = false;
    this.isLining = false;
    this.controller.dragBox = null;
    this.controller.drawingLine = null;
    this.controller.draw();
  }

  handleMouseMove(e) {
    // clear previous hover
    let hoveringShape = this.controller.hoveringShape;
    if (hoveringShape) {
      hoveringShape.isHovered = false;
      hoveringShape = null;
    }
    // hover
    for (let i = this.controller.rects.length - 1; i >= 0; i--) {
      const rect = this.controller.rects[i];
      if (rect.outerContains(this.getMousePos(e))) {
        rect.isHovered = true;
        this.controller.hoveringShape = rect;
      }
    }
    // drag
    if (this.isDragging) {
      this.endDragPoint = this.getMousePos(e);
      // move targets
      if (!this.isLining && this.controller.targets.length) {
        // set position of rect (mouse position + offset)
        for (const target of this.controller.targets) {
          target.pos = this.endDragPoint.plus(this.offset);
          target.setOuterRect(target.outerRect.outer_w, target.outerRect.outer_h);
          target.updatePortsPos();
          // update line position
          for (const line of this.controller.lines) {
            line.updateStartEndPoints();
          }
        }
      }
      // drag box
      else if (this.startDragPoint && !this.isLining) {
        // drag selection size
        const size = this.endDragPoint.minus(this.startDragPoint);

        this.controller.dragBox = new Rect(
          this.startDragPoint.x,
          this.startDragPoint.y,
          size.x,
          size.y
        );
      }
      // draw line
      else if (this.isLining) {
        this.controller.drawingLine = {
          startPoint: {
            x: this.lineStartPort.globalPos.x,
            y: this.lineStartPort.globalPos.y
          },
          endPoint: {
            x: this.endDragPoint.x,
            y: this.endDragPoint.y,
          }
        };
        CanvasViewInstance.drawLines();
      }
    }
     // draw
     this.controller.draw();
     this.controller.dataManager.delaySave();
  }

  handleKeyDown(e) {
    if (e.key === "Delete") {
      DrawControllerInstance.rectManager.deleteRect();
    }
  }
}
