import { INTERPOLATOR } from '../../../config/types';
import Item from '../shared/Item';
import Fragment from '../../Fragment';
import findElement from '../shared/findElement';
import parseJSON from '../../../utils/parseJSON';
import resolve from '../../resolvers/resolve';
import runloop from '../../../global/runloop';
import { warnIfDebug } from 'utils/log';
import { splitKeypath } from 'shared/keypaths';
import { isArray } from 'utils/is';

export default class Mapping extends Item {
	constructor ( options ) {
		super( options );

		this.name = options.template.n;

		this.owner = options.owner || options.up.owner || options.element || findElement( options.up );
		this.element = options.element || (this.owner.attributeByName ? this.owner : findElement( options.up ) );
		this.up = this.element.up; // shared
		this.ractive = this.up.ractive;

		this.element.attributeByName[ this.name ] = this;

		this.value = options.template.f;
	}

	bind () {
		const template = this.template.f;
		const viewmodel = this.element.instance.viewmodel;

		if ( template === 0 ) {
			// empty attributes are `true`
			viewmodel.joinKey( this.name ).set( true );
		}

		else if ( typeof template === 'string' ) {
			const parsed = parseJSON( template );
			viewmodel.joinKey( this.name ).set( parsed ? parsed.value : template );
		}

		else if ( isArray( template ) ) {
			createMapping( this, true );
		}
	}

	render () {}

	unbind () {
		if ( this.model ) this.model.unregister( this );
		if ( this.boundFragment ) this.boundFragment.unbind();

		if ( this.element.bound ) {
			if ( this.link.target === this.model ) this.link.owner.unlink();
		}
	}

	unrender () {}

	update () {
		if ( this.dirty ) {
			this.dirty = false;
			if ( this.boundFragment ) this.boundFragment.update();
		}
	}
}

function createMapping ( item ) {
	const template = item.template.f;
	const viewmodel = item.element.instance.viewmodel;
	const childData = viewmodel.value;

	if ( template.length === 1 && template[0].t === INTERPOLATOR ) {
		const model = resolve( item.up, template[0] );
		const val = model.get( false );

		// if the interpolator is not static
		if ( !template[0].s ) {
			item.model = model;
			item.link = viewmodel.createLink( item.name, model, template[0].r, { mapping: true } );

			// initialize parent side of the mapping from child data
			if ( val === undefined && !model.isReadonly && item.name in childData ) {
				model.set( childData[ item.name ] );
			}
		}

		// copy non-object, non-computed vals through
		else if ( typeof val !== 'object' || template[0].x ) {
			viewmodel.joinKey( splitKeypath( item.name ) ).set( val );
		}

		// warn about trying to copy an object
		else {
			warnIfDebug( `Cannot copy non-computed object value from static mapping '${item.name}'` );
		}
	}

	else {
		item.boundFragment = new Fragment({
			owner: item,
			template
		}).bind();

		item.model = viewmodel.joinKey( splitKeypath( item.name ) );
		item.model.set( item.boundFragment.valueOf() );

		// item is a *bit* of a hack
		item.boundFragment.bubble = () => {
			Fragment.prototype.bubble.call( item.boundFragment );
			// defer this to avoid mucking around model deps if there happens to be an expression involved
			runloop.scheduleTask(() => {
				item.boundFragment.update();
				item.model.set( item.boundFragment.valueOf() );
			});
		};
	}
}
