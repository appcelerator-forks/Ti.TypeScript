import { MyClickHandler } from 'myClickHandler';

function doClick(e) {
	let clickHandler = new MyClickHandler();
	let name: string = 'Ophir';
	
	clickHandler.HandleClick(name);
}

$.index.open();
