import { SocketGraphicsItem, SocketType } from "./socketgraphicsitem";
import { ImageCanvas } from "../designer/imagecanvas";
import {
	GraphicsItem,
	MouseDownEvent,
	MouseMoveEvent,
	MouseUpEvent
} from "./graphicsitem";
import { NodeScene } from "../scene";
import { Vector2 } from "./view";
import { MoveItemsAction } from "../actions/moveItemsaction";
import { UndoStack } from "../undostack";

export class NodeGraphicsItemRenderState {
	hovered = false;
	selected = false;
}

export class NodeGraphicsItem extends GraphicsItem {
	id!: string;
	sockets: SocketGraphicsItem[] = [];
	public title: string;
	thumbnail!: HTMLImageElement;
	imageCanvas: ImageCanvas;

	processingTime: number;
	processingSpeed: number;

	hit: boolean;

	// albedo, normal, height, etc...
	textureChannel: string;

	dragStartPos: Vector2;

	constructor(title: string) {
		super();
		this.width = 100;
		this.height = 100;
		this.title = title;
		this.imageCanvas = new ImageCanvas();
		this.processingTime = 0;
		this.processingSpeed = 0;
		this.hit = false;
	}

	public setScene(scene: NodeScene) {
		this.scene = scene;

		for (const sock of this.sockets) sock.setScene(scene);
	}

	public setTextureChannel(name: string) {
		this.textureChannel = name;
	}

	public clearTextureChannel() {
		this.textureChannel = null;
	}

	public setThumbnail(thumbnail: HTMLImageElement) {
		this.thumbnail = thumbnail;
	}

	public move(dx: number, dy: number) {
		this.x += dx;
		this.y += dy;
		for (const sock of this.sockets) {
			sock.move(dx, dy);
		}
	}

	draw(ctx: CanvasRenderingContext2D, renderData: any) {
		const renderState = <NodeGraphicsItemRenderState>renderData;
		
		this.processingSpeed = 160 - 5 * this.processingTime;
		this.processingSpeed = this.processingSpeed > -5 ? this.processingSpeed : -5;

		// border
		if (renderState.selected) {
			ctx.strokeStyle = "rgb(255, 255, 255)";
			ctx.beginPath();
			ctx.lineWidth = 8;
			//ctx.rect(this.x, this.y, this.width, this.height);
			this.roundRect(ctx, this.x, this.y, this.width, this.height, 2);
			ctx.stroke();
		}
	
		// background (if thumbnail is not showing)
		ctx.beginPath();
		ctx.fillStyle = "hsl(0, 0%, 14%)";
		this.roundRect(ctx, this.x, this.y, this.width, this.height, 4);
		ctx.fill();
		
		// thumbnail
		ctx.drawImage(
			this.imageCanvas.canvas,
			this.x,
			this.y,
			this.width,
			this.height
		);

		// title
		if (!renderState.hovered) {
			ctx.beginPath();
			ctx.fillStyle = "hsl(0, 0%, 26%)";
			ctx.rect(this.x, this.y, this.width, 20);
			ctx.fill();

			ctx.beginPath();
			//ctx.font = "14px monospace";
			ctx.font = "700 9px 'Open Sans'";
			ctx.fillStyle = "hsl(0, 0%, 95%)";
			const size = ctx.measureText(this.title);
			const textX = this.centerX() - size.width / 2;
			const textY = this.y + 14;
			ctx.fillText(this.title, textX, textY);
		}

		// DRAW SHAPE
		// outline
		ctx.beginPath();
		ctx.lineWidth = 4;
		if (renderState.selected) ctx.strokeStyle = "hsl(0, 0%, 100%)";
		else if (renderState.hovered) ctx.strokeStyle = "hsl(0, 0%, 24%)";
		else ctx.strokeStyle = "hsl(0, 0%, 20%)";
		this.roundRect(ctx, this.x, this.y, this.width, this.height, 4);
		ctx.stroke();

		ctx.beginPath();
		ctx.lineWidth = 4;
		this.roundRect(ctx, this.x, this.y, this.width, this.height, 4);
		ctx.stroke();

		for (const sock of this.sockets) {
			sock.draw(ctx, renderState);
		}

		// processing time
		ctx.beginPath();
		ctx.fillStyle = "hsla(50, 100%, 65%, 0.9)";
		let procTime = "calculating . . .";
		
		if (this.processingTime >= 0) {
			procTime = this.processingTime + "ms";
			ctx.fillStyle = `hsla(${this.processingSpeed}, 100%, 70%, 0.9)`;
		}

		ctx.font = "500 10px 'Open Sans'";
		const size = ctx.measureText(procTime);
		const textX = this.centerX() - size.width / 2;
		const textY = this.y + this.height + 14;
		ctx.fillText(procTime, textX, textY);

		// texture channel
		if (this.textureChannel) {
			ctx.beginPath();
			//ctx.font = "14px monospace";
			ctx.font = "12px 'Open Sans'";
			ctx.fillStyle = "hsla(166, 100%, 60%, 0.9)";
			const size = ctx.measureText(this.textureChannel.toUpperCase());
			const textX = this.centerX() - size.width / 2;
			//const textY = this.y + this.height + 14;

			const textY = this.y - 12;
			ctx.fillText(this.textureChannel.toUpperCase(), textX, textY);
		}
	}

	public setPos(x: number, y: number) {
		super.setPos(x, y);
		this.sortSockets();
	}

	public setCenter(x: number, y: number) {
		super.setCenter(x, y);
		this.sortSockets();
	}

	public sortSockets() {
		let socks = this.getInSockets();

		// top and bottom padding for sockets
		const pad = socks.length < 5 ? 10 : 0;

		// sort in sockets
		let incr = (this.height - pad * 2) / socks.length;
		let mid = incr / 2.0;
		let i = 0;
		for (const sock of socks) {
			const y = pad + i * incr + mid;
			const x = this.x;
			sock.setCenter(x, this.y + y);
			i++;
		}

		// sort out sockets
		socks = this.getOutSockets();
		incr = (this.height - pad * 2) / socks.length;
		mid = incr / 2.0;
		i = 0;
		for (const sock of socks) {
			const y = pad + i * incr + mid;
			const x = this.x + this.width;
			sock.setCenter(x, this.y + y);
			i++;
		}
	}

	getInSockets() {
		const array = [];
		for (const sock of this.sockets) {
			if (sock.socketType == SocketType.In) array.push(sock);
		}

		return array;
	}

	getInSocketByName(name: string): SocketGraphicsItem {
		for (const sock of this.sockets) {
			if (sock.socketType == SocketType.In)
				if (sock.title == name)
					//todo: separate title from name
					return sock;
		}

		return null;
	}

	getOutSockets() {
		const array = [];
		for (const sock of this.sockets) {
			if (sock.socketType == SocketType.Out) array.push(sock);
		}

		return array;
	}

	getOutSocketByName(name: string): SocketGraphicsItem {
		// blank or empty name means first out socket
		if (!name) {
			const socks = this.getOutSockets();
			if (socks.length > 0) return socks[0];
			else {
				console.log(
					"[warning] attempting to get  output socket from node with no output sockets"
				);
				return null;
			}
		}

		for (const sock of this.sockets) {
			if (sock.socketType == SocketType.Out)
				if (sock.title == name)
					//todo: separate title from name
					return sock;
		}

		return null;
	}

	// adds socket to node
	public addSocket(name: string, id: string, type: SocketType) {
		const sock = new SocketGraphicsItem();
		sock.id = id;
		sock.title = name;
		sock.node = this;
		sock.socketType = type;
		this.sockets.push(sock);

		this.sortSockets();
	}

	// MOUSE EVENTS
	public mouseDown(evt: MouseDownEvent) {
		this.hit = true;
		this.dragStartPos = new Vector2(this.x, this.y);
	}

	public mouseMove(evt: MouseMoveEvent) {
		if (this.hit) {
			// movement
			this.move(evt.deltaX, evt.deltaY);
		}
	}

	public mouseUp(evt: MouseUpEvent) {
		this.hit = false;

		// add undo/redo
		const newPos = new Vector2(this.x, this.y);

		if (newPos.x != this.dragStartPos.x || newPos.y != this.dragStartPos.y) {
			const action = new MoveItemsAction(
				[this],
				[this.dragStartPos.clone()],
				[newPos]
			);

			UndoStack.current.push(action);
		}
	}
}
