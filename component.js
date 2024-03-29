import { Core } from "./core.js";
import { 

	createElement,
	loopComponent,
	conditionalComponent,
	desrtoyChild,
	importComponent

} from "./utility.js";

import { Reactivity } from "./reactivity.js";

// fungsi ini melakukan
// set props terhadap semua
// props yang di miliki
// component
function setProps(child,props,value){

	if(child.props[props] !== void 0) child.props[props] = value;

	updateChild(child);

	if(child.children.length > 0) for(let x of child.children){

		setProps(x,props,value);

	}

	if(child.hasOwnProperty("child") && child.child.children.length > 0) for(let x of child.child.children){

		setProps(x,props,value);

	}

}

export let ComponentClass = {};

// melakukan register ke dalam ComponentClass untuk
// menambahkan component fragment ke sistem pencarian
export function registerComponentToClassArray(child){

	if(child.hasOwnProperty("@id") && ComponentClass.hasOwnProperty(child["@id"])){

		ComponentClass[child["@id"]].push(child);

	}else if(child.hasOwnProperty("@id")){

		ComponentClass[child["@id"]] = [];
		ComponentClass[child["@id"]].push(child);		

	}

	if(child.children.length > 0){

		for(let x of child.children) registerComponentToClassArray(x);

	}

}

export function getAllContextFrom(component,ctx){

	ctx = {
		...component.props
	}

	if(component.children.length > 0) for(let x of component.children){

		ctx = Object.assign(ctx,getAllContextFrom(x,ctx));

	}

	return ctx;

}

// fungsi ini berfungsi untuk mencari component dari ComponentClass
export function find(id){

	let context = {};

	if(id in ComponentClass) for(let x of ComponentClass[id]){

		context = {
			...context,
			...x.props,
			...getAllContextFrom(x)
		}

	}else{

		console.warn(`@id "${id}" is unknown `)

	}

	return {

		state: new Reactivity(context).create({
			eventSetter(args){

				if(id in ComponentClass) for(let x of ComponentClass[id]){

					setProps(x,args[1],args[2]);

				}else{

					console.warn(`@id "${id}" is unknown `)

				}

			},
			eventGetter(args){

				// do something

			}
		})

	}

}

// fungsi ini berfungsi untuk
// mengupdate semua child ketika
// props berubah
function updateChild(child){

	child.update();

	if(child.children.length > 0) for(let x of child.children){

		updateChild(x);

	}

}


// class component
// merupakan class yang berfungsi untuk
// membuat instance dari component
// dan membentuk fragment yang merupakan
// bentukan DOM TREE 
export class Component extends Core{

	constructor(){

		super();

		// mengset fragment dan context
		this.fragment = {};
		this.context = {};
		this.state = {};

	}


	// fungsi create merupakan
	// fungsi yang membuat parent (ROOT)
	// dari suatu component
	// dan mengembalikan 
	// nilai reaktif yang di set dengan setter dan getter
	create(name,inner){

		this.fragment = {
			...this.fragment,
			...createElement(name,inner),
			type: "ParentComponent"
		}

		this.context = {
			...this.context,
			...this.fragment.props
		}


		const fragment = this.fragment;

		this.state = new Reactivity(this.context).create({

			eventSetter(args){

				if(args[0].hasOwnProperty(args[1])){

					setProps(fragment,args[1],args[2]);

				}else{

					console.warn("props not found!");

				}

			},
			eventGetter(args){

				return args[0][args[1]];
				
			}
		})

		return {
			fragment,
			type: "ParentComponent"
		}

	}

	// fungsi untuk membuat raw data anak dan component anak
	createChild(name,inner,beParent = false){

		let child = createElement(name,inner);
		
		if(beParent) this.fragment = {
			...this.fragment,
			...child,
			type: "ChildComponent"
		}

		this.context = {
			...this.context,
			...child.props
		}

		const fragment = this.fragment;

		this.state = new Reactivity(this.context).create({

			eventSetter(args){

				if(args[0].hasOwnProperty(args[1])){

					setProps(fragment,args[1],args[2]);

				}else{

					console.warn("props not found!");

				}

			},
			eventGetter(args){

				return args[0][args[1]];
				
			}
		})

		return {
			...child,
			type: "ChildComponent"
		};

	}

	// fungsi untuk membuat looping component
	createLoop(name,inner){

		let element = loopComponent(name,inner,this.rootElement);

		this.context = {
			...this.context,
			...element.props
		}

		const fragment = this.fragment;

		this.state = new Reactivity(this.context).create({

			eventSetter(args){

				if(args[0].hasOwnProperty(args[1])){

					setProps(fragment,args[1],args[2]);

					

				}else{

					console.warn("props not found!");

				}

			},
			eventGetter(args){

				return args[0][args[1]];
				
			}
		});

		return {
			...element,
			type: "LoopComponent"
		};

	}

	importComponent(child,props){
		
		let importCom = importComponent(child.fragment,props);

		this.context = {
			...this.context,
			...child.context
		}

		const fragment = this.fragment;

		this.state = new Reactivity(this.context).create({

			eventSetter(args){

				if(args[0].hasOwnProperty(args[1])){

					setProps(fragment,args[1],args[2]);

				}else{

					console.warn("props not found!");

				}

			},
			eventGetter(args){

				return args[0][args[1]];
				
			}
		});


		return {
			...importCom,
			type: "ChildComponent",
			update(){



			}
		}

	}

	createCondition(name,inner){

		let element = conditionalComponent(name,inner);

		this.context = {
			...this.context,
			...element.props
		}

		const fragment = this.fragment;

		this.state = new Reactivity(this.context).create({

			eventSetter(args){

				if(args[0].hasOwnProperty(args[1])){

					setProps(fragment,args[1],args[2]);

				}else{

					console.warn("props not found!");

				}

			},
			eventGetter(args){

				return args[0][args[1]];
				
			}
		});

		return {
			...element,
			type: "conditionComponent"
		}

	}

	// fungsi untuk menyusun component
	// dari bentuk DOM TREE ke dalam 
	// bentuk real DOM TREE
	rootElement(child,parent){

		if(child.type === "conditionComponent"){
		
			parent.appendChild(child.element)
			child.update()
		
		}else{
		
			parent.appendChild(child.element);

		}

		if(child.children.length > 0){

			for(let x of child.children) this?.rootElement(x,child.element);

		}


	}

	// fungsi untuk melakukan render
	render(target){

		for(let x of this.fragment.children){

			this.rootElement(x,this.fragment.element);

		}

		target.appendChild(this.fragment.element);

	}

	destroy(){

		desrtoyChild(this.fragment);

	}

}