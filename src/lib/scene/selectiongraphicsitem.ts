import { SocketGraphicsItem } from "./socketgraphicsitem";
import {
	GraphicsItem,
	MouseDownEvent,
	MouseMoveEvent,
	MouseUpEvent
} from "./graphicsitem";
import { SceneView } from "./view";
import { Color } from "../designer/color";
import {
	IPropertyHolder,
	Property,
	StringProperty
} from "../designer/properties";
import { NodeScene } from "../scene";

// https://stackoverflow.com/questions/5026961/html5-canvas-ctx-filltext-wont-do-line-breaks
export class SelectionGraphicsItem extends GraphicsItem {
	view: SceneView;
	color: Color;

	padding: number;
	fontHeight: number;

	hit: boolean;
	items: GraphicsItem[];

	constructor(scene: NodeScene, view: SceneView) {
		super();
		this.scene = scene;
		this.view = view;
		this.color = new Color(0.9, 0.9, 0.9);
		this.items = new Array();

		this.hit = false;

		this.padding = 5;
		this.fontHeight = 20;
	}

	public isPointInside(px: number, py: number): boolean {
		//todo: loop through child items rect to see if a hit is made
		for (let item of this.items) {
			if (
				px >= item.left &&
				px <= item.left + item.getWidth() &&
				py >= item.top &&
				py <= item.top + item.getHeight()
			)
				return true;
		}

		return false;
	}

	draw(ctx: CanvasRenderingContext2D, renderData: any = null) {
		// should only display if hit or has items
		if (this.hit == false && this.items.length == 0) return;

		let width = this.width;
		let height = this.height;

		if (this.items.length == 0) {
			// stroke bounding rect
			ctx.beginPath();
			ctx.lineWidth = 3;
			ctx.strokeStyle = "rgb(250, 250, 250)";
			//this.roundRect(ctx, this.x, this.y, width, height, 1);
			ctx.rect(this.x, this.y, width, height);

			ctx.setLineDash([5, 3]);
			ctx.stroke();
			ctx.setLineDash([]);

			// if hit, then mouse is being dragged, these items are temporary
			let items = this.getHitItems();
			this.drawSelectedItems(items, ctx);
		} else {
			this.drawSelectedItems(this.items, ctx);
		}
	}

	drawSelectedItems(items: GraphicsItem[], ctx: CanvasRenderingContext2D) {
		for (let item of items) {
			ctx.beginPath();
			ctx.lineWidth = 5;
			ctx.strokeStyle = "rgb(250, 250, 250)";
			//this.roundRect(ctx, this.x, this.y, width, height, 1);
			ctx.rect(item.left, item.top, item.getWidth(), item.getHeight());

			ctx.setLineDash([5, 3]);
			ctx.stroke();
		}
		ctx.setLineDash([]);
	}

	getHitItems(): GraphicsItem[] {
		let items: GraphicsItem[] = [];

		for (let node of this.scene.nodes) {
			if (node.intersects(this)) {
				items.push(node);
			}
		}

		for (let item of this.scene.comments) {
			if (item.intersects(this)) {
				items.push(item);
			}
		}

		// Frames are treated differently
		// check if any of the sides were hit
		// by the selection box for a valid selection
		for (let item of this.scene.frames) {
			if (item.intersects(this)) {
				items.push(item);
			}
		}

		for (let item of this.scene.navigations) {
			if (item.intersects(this)) {
				items.push(item);
			}
		}

		return items;
	}

	// MOUSE EVENTS
	public mouseDown(evt: MouseDownEvent) {
		this.hit = true;
		if (this.items.length > 0) {
		} else {
			this.x = evt.globalX;
			this.y = evt.globalY;
		}
	}

	public mouseMove(evt: MouseMoveEvent) {
		if (this.items.length > 0) {
			for (let item of this.items) item.move(evt.deltaX, evt.deltaY);
		} else if (this.hit) {
			// movement
			this.width += evt.deltaX;
			this.height += evt.deltaY;
		}
	}

	public mouseUp(evt: MouseUpEvent) {
		this.hit = false;
		if (this.items.length == 0) this.items = this.getHitItems();
	}
}
