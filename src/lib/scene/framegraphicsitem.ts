import { SocketGraphicsItem } from "./socketgraphicsitem";
import {
	GraphicsItem,
	MouseDownEvent,
	MouseMoveEvent,
	MouseUpEvent
} from "./graphicsitem";
import { SceneView } from "./view";
import { Color } from "../designer/color";

enum XResizeDir {
	None,
	Left,
	Right
}

enum YResizeDir {
	None,
	Top,
	Bottom
}

export class FrameGraphicsItem extends GraphicsItem {
	title: string;
	description: string;
	showTitle: boolean;
	view: SceneView;
	color: Color;
	hit: boolean;

	xResize: XResizeDir;
	yResize: YResizeDir;

	// display properties
	handleSize: number;

	// the radius of the resize handle
	resizeHandleSize: number;

	public constructor(view: SceneView) {
		super();
		this.title = "Frame";
		this.description = "";
		this.showTitle = true;
		this.view = view;
		this.color = new Color(0.1, 0, 0.2);
		this.hit = false;

		this.xResize = XResizeDir.None;
		this.yResize = YResizeDir.None;

		this.handleSize = 20;
		this.resizeHandleSize = 10;
	}

	setSize(w: number, h: number) {
		this.width = w;
		this.height = h;
	}

	private buildColor(color: Color, alpha: number) {
		var col =
			"rgba(" +
			color.r * 255 +
			"," +
			color.g * 255 +
			"," +
			color.b * 255 +
			"," +
			alpha +
			")";
		//console.log(col);
		return col;
	}

	draw(ctx: CanvasRenderingContext2D, renderData: any = null) {
		// outer frame
		ctx.beginPath();
		ctx.lineWidth = 1;
		//ctx.strokeStyle = "rgb(100, 0, 0)";
		ctx.strokeStyle = this.buildColor(this.color, 1);
		this.roundRect(ctx, this.x, this.y, this.width, this.height, 1);
		ctx.stroke();

		// handle
		let handleSize = this.handleSize;
		ctx.beginPath();
		ctx.lineWidth = 1;
		//ctx.fillStyle = "rgba(100, 0, 0, 0.5)";
		ctx.fillStyle = this.buildColor(this.color, 0.5);
		this.roundRect(ctx, this.x, this.y, this.width, handleSize, 1);
		ctx.fill();

		ctx.beginPath();
		ctx.lineWidth = 1;
		//ctx.strokeStyle = "rgb(100, 0, 0, 0.8)";
		ctx.strokeStyle = this.buildColor(this.color, 0.8);
		this.roundRect(ctx, this.x, this.y, this.width, handleSize, 1);
		ctx.stroke();

		// body
		ctx.beginPath();
		ctx.lineWidth = 2;
		//ctx.fillStyle = "rgba(100, 0, 0, 0.2)";
		ctx.fillStyle = this.buildColor(this.color, 0.2);
		this.roundRect(
			ctx,
			this.x,
			this.y + handleSize,
			this.width,
			this.height - handleSize,
			1
		);
		ctx.fill();

		// title
		if (true == true) {
			ctx.beginPath();

			let fontSize = 18; // * this.view.zoomFactor;

			ctx.save();
			//ctx.scale(1.0 / this.view.zoomFactor, 1.0 / this.view.zoomFactor);
			ctx.setTransform(
				1,
				0,
				0,
				1,
				this.view.offset.x,
				this.view.offset.y
			);

			//ctx.font = fontSize + "px 'Open Sans'";
			ctx.font = "30px 'Open Sans'";
			ctx.fillStyle = "rgb(240, 240, 240)";
			//let size = ctx.measureText(this.textureChannel.toUpperCase());
			let textX = this.x;
			let textY = this.y;
			//ctx.fillText("Hello World", textX, textY - 5);
			ctx.fillText(
				"Hello World",
				textX * this.view.zoomFactor,
				(textY - 5) * this.view.zoomFactor
			);

			ctx.restore();
		}
	}

	public isPointInside(px: number, py: number): boolean {
		// check resize borders first

		// corners

		// sizes

		// top handle
		if (
			px >= this.x &&
			px <= this.x + this.width &&
			py >= this.y &&
			py <= this.y + this.handleSize
		)
			return true;
		return false;
	}

	// MOUSE EVENTS
	public mouseDown(evt: MouseDownEvent) {
		this.hit = true;
	}

	public mouseMove(evt: MouseMoveEvent) {
		if (this.hit) {
			// movement
			this.move(evt.deltaX, evt.deltaY);
		}
	}

	public mouseUp(evt: MouseUpEvent) {
		this.hit = false;
	}
}
