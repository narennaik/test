
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element$1(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_custom_element_data(node, prop, value) {
        if (prop in node) {
            node[prop] = typeof node[prop] === 'boolean' && value === '' ? true : value;
        }
        else {
            attr(node, prop, value);
        }
    }
    function children$1(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update$2(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update$2($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init$2(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children$1(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.47.0' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/components/video/brandbase/Progress.svelte generated by Svelte v3.47.0 */

    const file$c = "src/components/video/brandbase/Progress.svelte";

    function create_fragment$e(ctx) {
    	let progress;

    	const block = {
    		c: function create() {
    			progress = element$1("progress");
    			attr_dev(progress, "id", "progress");
    			attr_dev(progress, "max", "100");
    			progress.value = /*value*/ ctx[0];
    			attr_dev(progress, "class", "svelte-14zl911");
    			add_location(progress, file$c, 4, 0, 40);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, progress, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*value*/ 1) {
    				prop_dev(progress, "value", /*value*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(progress);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Progress', slots, []);
    	let { value } = $$props;
    	const writable_props = ['value'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Progress> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    	};

    	$$self.$capture_state = () => ({ value });

    	$$self.$inject_state = $$props => {
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [value];
    }

    class Progress extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$2(this, options, instance$e, create_fragment$e, safe_not_equal, { value: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Progress",
    			options,
    			id: create_fragment$e.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*value*/ ctx[0] === undefined && !('value' in props)) {
    			console.warn("<Progress> was created without expected prop 'value'");
    		}
    	}

    	get value() {
    		throw new Error("<Progress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Progress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/video/videoPlayer.svelte generated by Svelte v3.47.0 */
    const file$b = "src/components/video/videoPlayer.svelte";

    // (333:2) {#if canDisplayReplayIcon}
    function create_if_block_4$1(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element$1("div");
    			img = element$1("img");
    			attr_dev(img, "alt", "replay");
    			if (!src_url_equal(img.src, img_src_value = "https://i.l.inmobicdn.net/studio/asset/8f0ec91e-8573-4b30-b2ca-291781e436e6.png")) attr_dev(img, "src", img_src_value);
    			add_location(img, file$b, 334, 6, 7507);
    			attr_dev(div, "class", "vid-replay");
    			add_location(div, file$b, 333, 4, 7449);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);

    			if (!mounted) {
    				dispose = listen_dev(div, "tap", /*replayIconClicked*/ ctx[22], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(333:2) {#if canDisplayReplayIcon}",
    		ctx
    	});

    	return block;
    }

    // (342:2) {#if canDisplayPlayIcon}
    function create_if_block_3$1(ctx) {
    	let paper_icon_button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			paper_icon_button = element$1("paper-icon-button");
    			set_custom_element_data(paper_icon_button, "class", "icon");
    			set_custom_element_data(paper_icon_button, "icon", "av:play-circle-filled");
    			add_location(paper_icon_button, file$b, 342, 4, 7687);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, paper_icon_button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(paper_icon_button, "tap", /*playIconClicked*/ ctx[23], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(paper_icon_button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(342:2) {#if canDisplayPlayIcon}",
    		ctx
    	});

    	return block;
    }

    // (349:2) {#if canDisplayPauseIcon}
    function create_if_block_2$1(ctx) {
    	let paper_icon_button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			paper_icon_button = element$1("paper-icon-button");
    			set_custom_element_data(paper_icon_button, "class", "icon");
    			set_custom_element_data(paper_icon_button, "icon", "av:pause-circle-filled");
    			add_location(paper_icon_button, file$b, 349, 4, 7838);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, paper_icon_button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(paper_icon_button, "tap", /*pauseIconClicked*/ ctx[24], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(paper_icon_button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(349:2) {#if canDisplayPauseIcon}",
    		ctx
    	});

    	return block;
    }

    // (358:4) {#if showVolumeControl}
    function create_if_block$4(ctx) {
    	let div;

    	function select_block_type(ctx, dirty) {
    		if (/*muted*/ ctx[4]) return create_if_block_1$2;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element$1("div");
    			if_block.c();
    			attr_dev(div, "class", "vol-btn-cont iconToHide");
    			add_location(div, file$b, 358, 6, 8023);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(358:4) {#if showVolumeControl}",
    		ctx
    	});

    	return block;
    }

    // (367:8) {:else}
    function create_else_block(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element$1("div");
    			img = element$1("img");
    			attr_dev(img, "alt", "mute");
    			if (!src_url_equal(img.src, img_src_value = "https://videoassets41.blob.core.windows.net/assets/sound%20on.svg")) attr_dev(img, "src", img_src_value);
    			add_location(img, file$b, 368, 12, 8408);
    			attr_dev(div, "id", "ad_mute");
    			attr_dev(div, "class", "volume");
    			add_location(div, file$b, 367, 10, 8340);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*muteAction*/ ctx[8], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(367:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (360:8) {#if muted}
    function create_if_block_1$2(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element$1("div");
    			img = element$1("img");
    			attr_dev(img, "alt", "unmute");
    			if (!src_url_equal(img.src, img_src_value = "https://videoassets41.blob.core.windows.net/assets/sound%20off.svg")) attr_dev(img, "src", img_src_value);
    			add_location(img, file$b, 361, 12, 8163);
    			attr_dev(div, "id", "ad_unmute");
    			attr_dev(div, "class", "volume");
    			add_location(div, file$b, 360, 10, 8091);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*unMuteAction*/ ctx[9], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(360:8) {#if muted}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let div2;
    	let video_1;
    	let video_1_src_value;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let div0;
    	let t4;
    	let div1;
    	let mounted;
    	let dispose;
    	let if_block0 = /*canDisplayReplayIcon*/ ctx[12] && create_if_block_4$1(ctx);
    	let if_block1 = /*canDisplayPlayIcon*/ ctx[10] && create_if_block_3$1(ctx);
    	let if_block2 = /*canDisplayPauseIcon*/ ctx[11] && create_if_block_2$1(ctx);
    	let if_block3 = /*showVolumeControl*/ ctx[5] && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			div2 = element$1("div");
    			video_1 = element$1("video");
    			t0 = space();
    			if (if_block0) if_block0.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			t2 = space();
    			if (if_block2) if_block2.c();
    			t3 = space();
    			div0 = element$1("div");
    			if (if_block3) if_block3.c();
    			t4 = space();
    			div1 = element$1("div");
    			attr_dev(video_1, "id", "main-video");
    			attr_dev(video_1, "poster", /*thumbnail*/ ctx[1]);
    			video_1.autoplay = /*autoplay*/ ctx[2];
    			if (!src_url_equal(video_1.src, video_1_src_value = /*src*/ ctx[0])) attr_dev(video_1, "src", video_1_src_value);
    			video_1.muted = /*muted*/ ctx[4];
    			attr_dev(video_1, "hidetimer", /*hideTimer*/ ctx[7]);
    			attr_dev(video_1, "iconsvisible", /*iconsVisible*/ ctx[6]);
    			attr_dev(video_1, "preload", "");
    			attr_dev(video_1, "webkit-playsinline", "");
    			video_1.playsInline = true;
    			add_location(video_1, file$b, 310, 2, 6976);
    			attr_dev(div0, "class", "controls-bar");
    			add_location(div0, file$b, 356, 2, 7962);
    			attr_dev(div1, "class", "cont-overlay");
    			add_location(div1, file$b, 377, 2, 8604);
    			attr_dev(div2, "id", "container");
    			add_location(div2, file$b, 309, 0, 6934);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, video_1);
    			/*video_1_binding*/ ctx[32](video_1);
    			append_dev(div2, t0);
    			if (if_block0) if_block0.m(div2, null);
    			append_dev(div2, t1);
    			if (if_block1) if_block1.m(div2, null);
    			append_dev(div2, t2);
    			if (if_block2) if_block2.m(div2, null);
    			append_dev(div2, t3);
    			append_dev(div2, div0);
    			if (if_block3) if_block3.m(div0, null);
    			append_dev(div2, t4);
    			append_dev(div2, div1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(video_1, "canplay", /*videoCanPlay*/ ctx[13], false, false, false),
    					listen_dev(video_1, "playing", /*play*/ ctx[18], false, false, false),
    					listen_dev(video_1, "pause", /*pause*/ ctx[17], false, false, false),
    					listen_dev(video_1, "emptied", /*videoEmptied*/ ctx[15], false, false, false),
    					listen_dev(video_1, "ended", /*videoEnded*/ ctx[16], false, false, false),
    					listen_dev(video_1, "timeupdate", /*videoTimeUpdated*/ ctx[14], false, false, false),
    					listen_dev(video_1, "error", /*videoErrored*/ ctx[19], false, false, false),
    					listen_dev(video_1, "iconshow", /*showIcons*/ ctx[20], false, false, false),
    					listen_dev(div1, "tap", /*setControlsBehaviour*/ ctx[21], false, false, false),
    					listen_dev(div2, "tap", /*showIcons*/ ctx[20], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*thumbnail*/ 2) {
    				attr_dev(video_1, "poster", /*thumbnail*/ ctx[1]);
    			}

    			if (dirty[0] & /*autoplay*/ 4) {
    				prop_dev(video_1, "autoplay", /*autoplay*/ ctx[2]);
    			}

    			if (dirty[0] & /*src*/ 1 && !src_url_equal(video_1.src, video_1_src_value = /*src*/ ctx[0])) {
    				attr_dev(video_1, "src", video_1_src_value);
    			}

    			if (dirty[0] & /*muted*/ 16) {
    				prop_dev(video_1, "muted", /*muted*/ ctx[4]);
    			}

    			if (/*canDisplayReplayIcon*/ ctx[12]) if_block0.p(ctx, dirty);
    			if (/*canDisplayPlayIcon*/ ctx[10]) if_block1.p(ctx, dirty);
    			if (/*canDisplayPauseIcon*/ ctx[11]) if_block2.p(ctx, dirty);

    			if (/*showVolumeControl*/ ctx[5]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block$4(ctx);
    					if_block3.c();
    					if_block3.m(div0, null);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			/*video_1_binding*/ ctx[32](null);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('VideoPlayer', slots, []);
    	let { duration } = $$props;
    	let { controls = [] } = $$props;
    	let { src = '' } = $$props;
    	let { thumbnail = '' } = $$props;
    	let { showControls = '' } = $$props;
    	let { autoplay } = $$props;
    	const dispatch = createEventDispatcher();

    	const statuses = {
    		EMPTY: 'empty',
    		PLAYING: 'playing',
    		PAUSED: 'paused',
    		CAN_PLAY: 'canPlay',
    		COMPLETED: 'completed'
    	};

    	let enabled_icons;
    	let delayForSkip = 3; //in sec
    	let iconFadeOutDuration = 3000; //in milisec
    	let iconsVisible;
    	let hideTimer;
    	let controlsSetting = { ON_TAP: 'on-tap' };
    	let videoElement;
    	let showTimer = false;
    	let showPauseIcon = false;
    	let showReplayIcon = false;
    	let showPlayIcon = false;
    	let initialLoadDone = false;
    	let loop = false;
    	let muted = true;
    	let showVolumeControl = false;
    	let status = statuses.EMPTY;
    	let prevStatus;

    	onMount(() => {
    		controls.forEach(control => {
    			switch (control) {
    				case 'PLAY':
    					showPlayIcon = true;
    					break;
    				case 'PAUSE':
    					showPauseIcon = true;
    					break;
    				case 'REPLAY':
    					showReplayIcon = true;
    					break;
    				case 'TIMER':
    					showTimer = true;
    					break;
    				case 'VOLUME':
    					$$invalidate(5, showVolumeControl = true);
    					break;
    			}
    		});
    	});

    	onMount(() => {
    		dispatch('inmobi-video-attached', { videoDomElement: videoElement });
    	});

    	function muteAction() {
    		$$invalidate(4, muted = true);
    		dispatch('inmobi-video-mute');
    	}

    	function unMuteAction() {
    		$$invalidate(4, muted = false);
    		dispatch('inmobi-video-unmute');
    	}

    	let canDisplayPlayIcon = src && showPlayIcon && [statuses.CAN_PLAY, statuses.PAUSED, statuses.COMPLETED, statuses.EMPTY].indexOf(status) !== -1;
    	let canDisplayPauseIcon = showPauseIcon && status === statuses.PLAYING;
    	let canDisplayReplayIcon = showReplayIcon && status === statuses.COMPLETED;
    	let orientation = 'landscape';

    	function videoCanPlay() {
    		$$invalidate(29, status = statuses.CAN_PLAY);
    		dispatch('inmobi-video-can-play');
    		const videoHeight = videoElement.videoHeight;
    		var videoWidth = videoElement.videoWidth;

    		if (videoWidth > videoHeight) {
    			orientation = 'landscape';
    		} else {
    			orientation = 'portrait';
    		}
    	}

    	let currentTime;

    	function videoTimeUpdated() {
    		currentTime = videoElement.currentTime;
    		dispatch('inmobi-video-time-update', { currentTime });

    		if (duration) {
    			var pct = Math.floor(currentTime / duration * 100);

    			if (!_95Fired && pct >= 95) {
    				/* 95% */
    				_95Fired = true;

    				dispatch('inmobi-video-quartile', { quartile: '95%' });
    			} else if (!_90Fired && pct >= 90) {
    				/* 90% */
    				_90Fired = true;

    				dispatch('inmobi-video-quartile', { quartile: '90%' });
    			} else if (!_85Fired && pct >= 85) {
    				/* 85% */
    				_85Fired = true;

    				dispatch('inmobi-video-quartile', { quartile: '85%' });
    			} else if (!_80Fired && pct >= 80) {
    				/* 80% */
    				_80Fired = true;

    				dispatch('inmobi-video-quartile', { quartile: '80%' });
    			} else if (!_q3Fired && pct >= 75) {
    				/* q3 */
    				_q3Fired = true;

    				dispatch('inmobi-video-quartile', { quartile: 'q3' });
    			} else if (!_q2Fired && pct >= 50) {
    				/* q2 */
    				_q2Fired = true;

    				dispatch('inmobi-video-quartile', { quartile: 'q2' });
    			} else if (!_q1Fired && pct >= 25) {
    				/* q1 */
    				_q1Fired = true;

    				dispatch('inmobi-video-quartile', { quartile: 'q1' });
    			}
    		}
    	}

    	function videoEmptied() {
    		$$invalidate(29, status = statuses.EMPTY);
    	}

    	function videoEnded() {
    		$$invalidate(29, status = statuses.COMPLETED);

    		if (showReplayIcon) {
    			showPlayIcon = false;
    		}

    		$$invalidate(31, videoCompleted = true);
    		dispatch('inmobi-video-ended');

    		if (loop == true) {
    			videoElement.play();
    		}
    	}

    	function pause() {
    		videoElement.pause();
    		dispatch('inmobi-video-pause');
    	}

    	let videoCompleted = false;
    	let _80Fired = false;
    	let _85Fired = false;
    	let _90Fired = false;
    	let _95Fired = false;
    	let _q3Fired = false;
    	let _q2Fired = false;
    	let _q1Fired = false;

    	function reintialiseVars() {
    		$$invalidate(31, videoCompleted = false);
    		_80Fired = false;
    		_85Fired = false;
    		_90Fired = false;
    		_95Fired = false;
    		_q3Fired = false;
    		_q2Fired = false;
    		_q1Fired = false;

    		/*show play icon to true after hiding for replay icon at video end*/
    		if (showPauseIcon) {
    			showPlayIcon = true;
    		}
    	}

    	function play() {
    		videoElement.play();

    		if (videoCompleted) {
    			reintialiseVars();
    		}

    		dispatch('inmobi-video-play');
    	}

    	function stop() {
    		videoElement.pause();
    		currentTime = 0;
    		dispatch('inmobi-video-stop');
    	}

    	function seek(time) {
    		$$invalidate(3, videoElement.currentTime = time, videoElement);
    		currentTime = time;
    	}

    	function videoErrored(event) {
    		var errorCode = event?.target?.error?.code;
    		dispatch('inmobi-video-error', { errorCode });
    	}

    	function showIcons(event) {
    		var items = document.getElementsByClassName('iconToHide');
    		clearTimeout(enabled_icons);

    		if (video.currentTime > delayForSkip && event.target.id !== 'ad_mute' && event.target.id !== 'ad_unmute') {
    			//"inmobi-video-showIcon" should not be fired when i click on mute/unmute, use case: for high ctr experience navigation to flp was happening on click of mute/unmute button
    			dispatch('inmobi-video-showIcons');
    		}

    		for (let i = 0; i < items.length; i++) {
    			items[i].style.display = 'inline';
    		}

    		enabled_icons = setTimeout(_hideIcons, iconFadeOutDuration);
    	}

    	function setControlsBehaviour() {
    		if (controls === controlsSetting.ON_TAP) {
    			showTimer = true;
    			$$invalidate(5, showVolumeControl = true);
    			setControlTimer();
    		}
    	}

    	let controlsTimer;

    	function setControlTimer() {
    		if (controlsTimer) {
    			clearTimeout(controlsTimer);
    		}

    		controlsTimer = setTimeout(
    			function () {
    				showTimer = false;
    				$$invalidate(5, showVolumeControl = false);
    			},
    			3000
    		);
    	}

    	function replayIconClicked() {
    		reintialiseVars();
    		videoElement.play();
    	}

    	function playIconClicked() {
    		videoElement.play();
    	}

    	function pauseIconClicked() {
    		videoElement.pause();
    	}

    	const writable_props = ['duration', 'controls', 'src', 'thumbnail', 'showControls', 'autoplay'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<VideoPlayer> was created with unknown prop '${key}'`);
    	});

    	function video_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			videoElement = $$value;
    			$$invalidate(3, videoElement);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('duration' in $$props) $$invalidate(25, duration = $$props.duration);
    		if ('controls' in $$props) $$invalidate(26, controls = $$props.controls);
    		if ('src' in $$props) $$invalidate(0, src = $$props.src);
    		if ('thumbnail' in $$props) $$invalidate(1, thumbnail = $$props.thumbnail);
    		if ('showControls' in $$props) $$invalidate(27, showControls = $$props.showControls);
    		if ('autoplay' in $$props) $$invalidate(2, autoplay = $$props.autoplay);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		createEventDispatcher,
    		duration,
    		controls,
    		src,
    		thumbnail,
    		showControls,
    		autoplay,
    		dispatch,
    		statuses,
    		enabled_icons,
    		delayForSkip,
    		iconFadeOutDuration,
    		iconsVisible,
    		hideTimer,
    		controlsSetting,
    		videoElement,
    		showTimer,
    		showPauseIcon,
    		showReplayIcon,
    		showPlayIcon,
    		initialLoadDone,
    		loop,
    		muted,
    		showVolumeControl,
    		status,
    		prevStatus,
    		muteAction,
    		unMuteAction,
    		canDisplayPlayIcon,
    		canDisplayPauseIcon,
    		canDisplayReplayIcon,
    		orientation,
    		videoCanPlay,
    		currentTime,
    		videoTimeUpdated,
    		videoEmptied,
    		videoEnded,
    		pause,
    		videoCompleted,
    		_80Fired,
    		_85Fired,
    		_90Fired,
    		_95Fired,
    		_q3Fired,
    		_q2Fired,
    		_q1Fired,
    		reintialiseVars,
    		play,
    		stop,
    		seek,
    		videoErrored,
    		showIcons,
    		setControlsBehaviour,
    		controlsTimer,
    		setControlTimer,
    		replayIconClicked,
    		playIconClicked,
    		pauseIconClicked
    	});

    	$$self.$inject_state = $$props => {
    		if ('duration' in $$props) $$invalidate(25, duration = $$props.duration);
    		if ('controls' in $$props) $$invalidate(26, controls = $$props.controls);
    		if ('src' in $$props) $$invalidate(0, src = $$props.src);
    		if ('thumbnail' in $$props) $$invalidate(1, thumbnail = $$props.thumbnail);
    		if ('showControls' in $$props) $$invalidate(27, showControls = $$props.showControls);
    		if ('autoplay' in $$props) $$invalidate(2, autoplay = $$props.autoplay);
    		if ('enabled_icons' in $$props) enabled_icons = $$props.enabled_icons;
    		if ('delayForSkip' in $$props) delayForSkip = $$props.delayForSkip;
    		if ('iconFadeOutDuration' in $$props) iconFadeOutDuration = $$props.iconFadeOutDuration;
    		if ('iconsVisible' in $$props) $$invalidate(6, iconsVisible = $$props.iconsVisible);
    		if ('hideTimer' in $$props) $$invalidate(7, hideTimer = $$props.hideTimer);
    		if ('controlsSetting' in $$props) controlsSetting = $$props.controlsSetting;
    		if ('videoElement' in $$props) $$invalidate(3, videoElement = $$props.videoElement);
    		if ('showTimer' in $$props) showTimer = $$props.showTimer;
    		if ('showPauseIcon' in $$props) showPauseIcon = $$props.showPauseIcon;
    		if ('showReplayIcon' in $$props) showReplayIcon = $$props.showReplayIcon;
    		if ('showPlayIcon' in $$props) showPlayIcon = $$props.showPlayIcon;
    		if ('initialLoadDone' in $$props) $$invalidate(28, initialLoadDone = $$props.initialLoadDone);
    		if ('loop' in $$props) loop = $$props.loop;
    		if ('muted' in $$props) $$invalidate(4, muted = $$props.muted);
    		if ('showVolumeControl' in $$props) $$invalidate(5, showVolumeControl = $$props.showVolumeControl);
    		if ('status' in $$props) $$invalidate(29, status = $$props.status);
    		if ('prevStatus' in $$props) $$invalidate(30, prevStatus = $$props.prevStatus);
    		if ('canDisplayPlayIcon' in $$props) $$invalidate(10, canDisplayPlayIcon = $$props.canDisplayPlayIcon);
    		if ('canDisplayPauseIcon' in $$props) $$invalidate(11, canDisplayPauseIcon = $$props.canDisplayPauseIcon);
    		if ('canDisplayReplayIcon' in $$props) $$invalidate(12, canDisplayReplayIcon = $$props.canDisplayReplayIcon);
    		if ('orientation' in $$props) orientation = $$props.orientation;
    		if ('currentTime' in $$props) currentTime = $$props.currentTime;
    		if ('videoCompleted' in $$props) $$invalidate(31, videoCompleted = $$props.videoCompleted);
    		if ('_80Fired' in $$props) _80Fired = $$props._80Fired;
    		if ('_85Fired' in $$props) _85Fired = $$props._85Fired;
    		if ('_90Fired' in $$props) _90Fired = $$props._90Fired;
    		if ('_95Fired' in $$props) _95Fired = $$props._95Fired;
    		if ('_q3Fired' in $$props) _q3Fired = $$props._q3Fired;
    		if ('_q2Fired' in $$props) _q2Fired = $$props._q2Fired;
    		if ('_q1Fired' in $$props) _q1Fired = $$props._q1Fired;
    		if ('controlsTimer' in $$props) controlsTimer = $$props.controlsTimer;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*autoplay, initialLoadDone, status, videoElement, prevStatus*/ 1879048204 | $$self.$$.dirty[1] & /*videoCompleted*/ 1) {
    			{
    				if (autoplay && !videoCompleted && initialLoadDone && // !notReady && // dont know what not Ready does
    				status !== statuses.PAUSED) {
    					videoElement.play();
    				}

    				if (prevStatus === statuses.EMPTY && status === statuses.CAN_PLAY) {
    					$$invalidate(28, initialLoadDone = true);
    				} else {
    					/* resetting inital load for replay */
    					$$invalidate(28, initialLoadDone = false);
    				}

    				$$invalidate(30, prevStatus = status);
    			}
    		}
    	};

    	return [
    		src,
    		thumbnail,
    		autoplay,
    		videoElement,
    		muted,
    		showVolumeControl,
    		iconsVisible,
    		hideTimer,
    		muteAction,
    		unMuteAction,
    		canDisplayPlayIcon,
    		canDisplayPauseIcon,
    		canDisplayReplayIcon,
    		videoCanPlay,
    		videoTimeUpdated,
    		videoEmptied,
    		videoEnded,
    		pause,
    		play,
    		videoErrored,
    		showIcons,
    		setControlsBehaviour,
    		replayIconClicked,
    		playIconClicked,
    		pauseIconClicked,
    		duration,
    		controls,
    		showControls,
    		initialLoadDone,
    		status,
    		prevStatus,
    		videoCompleted,
    		video_1_binding
    	];
    }

    class VideoPlayer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init$2(
    			this,
    			options,
    			instance$d,
    			create_fragment$d,
    			safe_not_equal,
    			{
    				duration: 25,
    				controls: 26,
    				src: 0,
    				thumbnail: 1,
    				showControls: 27,
    				autoplay: 2
    			},
    			null,
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "VideoPlayer",
    			options,
    			id: create_fragment$d.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*duration*/ ctx[25] === undefined && !('duration' in props)) {
    			console.warn("<VideoPlayer> was created without expected prop 'duration'");
    		}

    		if (/*autoplay*/ ctx[2] === undefined && !('autoplay' in props)) {
    			console.warn("<VideoPlayer> was created without expected prop 'autoplay'");
    		}
    	}

    	get duration() {
    		throw new Error("<VideoPlayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<VideoPlayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get controls() {
    		throw new Error("<VideoPlayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set controls(value) {
    		throw new Error("<VideoPlayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get src() {
    		throw new Error("<VideoPlayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set src(value) {
    		throw new Error("<VideoPlayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get thumbnail() {
    		throw new Error("<VideoPlayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set thumbnail(value) {
    		throw new Error("<VideoPlayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showControls() {
    		throw new Error("<VideoPlayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showControls(value) {
    		throw new Error("<VideoPlayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get autoplay() {
    		throw new Error("<VideoPlayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set autoplay(value) {
    		throw new Error("<VideoPlayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/video/VideoWrapper.svelte generated by Svelte v3.47.0 */
    const file$a = "src/components/video/VideoWrapper.svelte";

    // (102:0) {#if experienceType === 'BrandBase'}
    function create_if_block$3(ctx) {
    	let progress;
    	let current;

    	progress = new Progress({
    			props: { value: /*progressPercentage*/ ctx[7] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(progress.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(progress, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const progress_changes = {};
    			if (dirty & /*progressPercentage*/ 128) progress_changes.value = /*progressPercentage*/ ctx[7];
    			progress.$set(progress_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(progress.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(progress.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(progress, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(102:0) {#if experienceType === 'BrandBase'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let div1;
    	let videoplayer;
    	let t0;
    	let div0;
    	let t1;
    	let if_block_anchor;
    	let current;
    	let mounted;
    	let dispose;

    	videoplayer = new VideoPlayer({
    			props: {
    				src: /*$videoMachineRef*/ ctx[6]?.context?.vastData?.videoData?.vidUrl,
    				notReady: /*notReady*/ ctx[2],
    				autoplay: /*$videoMachineRef*/ ctx[6]?.matches('video.video.default.playing'),
    				muted: /*$videoMachineRef*/ ctx[6]?.context?.soundRef?.state?.matches('show.muted'),
    				hideTimer: /*hideTimer*/ ctx[3],
    				showControls: /*showControls*/ ctx[4],
    				iconsVisible: /*iconsVisible*/ ctx[5],
    				duration: /*$videoMachineRef*/ ctx[6]?.context?.vastData?.videoData?.videoDuration,
    				controls: /*controls*/ ctx[18]
    			},
    			$$inline: true
    		});

    	videoplayer.$on("inmobi-video-play", /*onVideoPlay*/ ctx[9]);
    	videoplayer.$on("inmobi-video-pause", /*onVideoPause*/ ctx[10]);
    	videoplayer.$on("inmobi-video-time-update", /*onVideoTimeUpdate*/ ctx[14]);
    	videoplayer.$on("inmobi-video-attached", /*onVideoAttached*/ ctx[8]);
    	videoplayer.$on("inmobi-video-mute", /*onVideoMute*/ ctx[19]);
    	videoplayer.$on("inmobi-video-unmute", /*onVideoUnmute*/ ctx[20]);
    	videoplayer.$on("inmobi-video-ended", /*onVideoEnded*/ ctx[11]);
    	videoplayer.$on("inmobi-video-error", /*onVideoError*/ ctx[12]);
    	videoplayer.$on("inmobi-video-stop", /*onVideoStop*/ ctx[13]);
    	videoplayer.$on("inmobi-video-quartile", /*onVideoQuartile*/ ctx[15]);
    	videoplayer.$on("inmobi-video-showIcons", /*onVideoShowIcons*/ ctx[16]);
    	let if_block = /*experienceType*/ ctx[1] === 'BrandBase' && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			div1 = element$1("div");
    			create_component(videoplayer.$$.fragment);
    			t0 = space();
    			div0 = element$1("div");
    			t1 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(div0, "class", "vol-overlay");
    			set_style(div0, "display", "none");
    			add_location(div0, file$a, 99, 2, 2743);
    			attr_dev(div1, "class", "svelte-u9r2nm");
    			toggle_class(div1, "hide", !/*$videoMachineRef*/ ctx[6]?.matches('video.video.default.playing'));
    			add_location(div1, file$a, 76, 0, 1790);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			mount_component(videoplayer, div1, null);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			insert_dev(target, t1, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div0, "click", /*videoCTA*/ ctx[17], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const videoplayer_changes = {};
    			if (dirty & /*$videoMachineRef*/ 64) videoplayer_changes.src = /*$videoMachineRef*/ ctx[6]?.context?.vastData?.videoData?.vidUrl;
    			if (dirty & /*notReady*/ 4) videoplayer_changes.notReady = /*notReady*/ ctx[2];
    			if (dirty & /*$videoMachineRef*/ 64) videoplayer_changes.autoplay = /*$videoMachineRef*/ ctx[6]?.matches('video.video.default.playing');
    			if (dirty & /*$videoMachineRef*/ 64) videoplayer_changes.muted = /*$videoMachineRef*/ ctx[6]?.context?.soundRef?.state?.matches('show.muted');
    			if (dirty & /*hideTimer*/ 8) videoplayer_changes.hideTimer = /*hideTimer*/ ctx[3];
    			if (dirty & /*showControls*/ 16) videoplayer_changes.showControls = /*showControls*/ ctx[4];
    			if (dirty & /*iconsVisible*/ 32) videoplayer_changes.iconsVisible = /*iconsVisible*/ ctx[5];
    			if (dirty & /*$videoMachineRef*/ 64) videoplayer_changes.duration = /*$videoMachineRef*/ ctx[6]?.context?.vastData?.videoData?.videoDuration;
    			videoplayer.$set(videoplayer_changes);

    			if (dirty & /*$videoMachineRef*/ 64) {
    				toggle_class(div1, "hide", !/*$videoMachineRef*/ ctx[6]?.matches('video.video.default.playing'));
    			}

    			if (/*experienceType*/ ctx[1] === 'BrandBase') {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*experienceType*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(videoplayer.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(videoplayer.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(videoplayer);
    			if (detaching) detach_dev(t1);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let $videoMachineRef,
    		$$unsubscribe_videoMachineRef = noop,
    		$$subscribe_videoMachineRef = () => ($$unsubscribe_videoMachineRef(), $$unsubscribe_videoMachineRef = subscribe(videoMachineRef, $$value => $$invalidate(6, $videoMachineRef = $$value)), videoMachineRef);

    	$$self.$$.on_destroy.push(() => $$unsubscribe_videoMachineRef());
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('VideoWrapper', slots, []);
    	let { videoMachineRef } = $$props;
    	validate_store(videoMachineRef, 'videoMachineRef');
    	$$subscribe_videoMachineRef();
    	let { experienceType = 'BrandBase' } = $$props;
    	let { notReady } = $$props;
    	let { autoPlay } = $$props;
    	let { hideTimer } = $$props;
    	let { showControls } = $$props;
    	let { iconsVisible } = $$props;
    	let currentTime = 0;

    	const onVideoAttached = () => {
    		setTimeout(
    			() => {
    				videoMachineRef.send('READY');
    			},
    			1000
    		);
    	};

    	const onVideoPlay = () => {
    		videoMachineRef.send('playing');
    	};

    	const onVideoPause = () => {
    		videoMachineRef.send('paused');
    	};

    	const onVideoEnded = () => {
    		videoMachineRef?.send('VIDEO_COMPLETE');
    	};

    	const onVideoError = () => {
    		videoMachineRef.send('error');
    	};

    	const onVideoStop = () => {
    		videoMachineRef.send('stopped');
    	};

    	const onVideoTimeUpdate = params => {
    		$$invalidate(22, currentTime = params?.detail?.currentTime);
    	};

    	const onVideoQuartile = params => {
    		switch (params?.detail?.quartile) {
    			case 'q1':
    				videoMachineRef?.send('FIRST_QUARTILE');
    				break;
    			case 'q2':
    				videoMachineRef?.send('SECOND_QUARTILE');
    				break;
    			case 'q3':
    				videoMachineRef?.send('THIRD_QUARTILE');
    				break;
    		}
    	};

    	const onVideoShowIcons = () => {
    		
    	};

    	const videoCTA = () => {
    		
    	};

    	const controls = ['TIMER', 'VOLUME'];

    	// Volume control events
    	const onVideoMute = () => {
    		$videoMachineRef?.context?.soundRef?.send('MUTE');
    	};

    	const onVideoUnmute = () => {
    		$videoMachineRef?.context?.soundRef?.send('UNMUTE');
    	};

    	let progressPercentage = 0;

    	const writable_props = [
    		'videoMachineRef',
    		'experienceType',
    		'notReady',
    		'autoPlay',
    		'hideTimer',
    		'showControls',
    		'iconsVisible'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<VideoWrapper> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('videoMachineRef' in $$props) $$subscribe_videoMachineRef($$invalidate(0, videoMachineRef = $$props.videoMachineRef));
    		if ('experienceType' in $$props) $$invalidate(1, experienceType = $$props.experienceType);
    		if ('notReady' in $$props) $$invalidate(2, notReady = $$props.notReady);
    		if ('autoPlay' in $$props) $$invalidate(21, autoPlay = $$props.autoPlay);
    		if ('hideTimer' in $$props) $$invalidate(3, hideTimer = $$props.hideTimer);
    		if ('showControls' in $$props) $$invalidate(4, showControls = $$props.showControls);
    		if ('iconsVisible' in $$props) $$invalidate(5, iconsVisible = $$props.iconsVisible);
    	};

    	$$self.$capture_state = () => ({
    		Progress,
    		VideoPlayer,
    		videoMachineRef,
    		experienceType,
    		notReady,
    		autoPlay,
    		hideTimer,
    		showControls,
    		iconsVisible,
    		currentTime,
    		onVideoAttached,
    		onVideoPlay,
    		onVideoPause,
    		onVideoEnded,
    		onVideoError,
    		onVideoStop,
    		onVideoTimeUpdate,
    		onVideoQuartile,
    		onVideoShowIcons,
    		videoCTA,
    		controls,
    		onVideoMute,
    		onVideoUnmute,
    		progressPercentage,
    		$videoMachineRef
    	});

    	$$self.$inject_state = $$props => {
    		if ('videoMachineRef' in $$props) $$subscribe_videoMachineRef($$invalidate(0, videoMachineRef = $$props.videoMachineRef));
    		if ('experienceType' in $$props) $$invalidate(1, experienceType = $$props.experienceType);
    		if ('notReady' in $$props) $$invalidate(2, notReady = $$props.notReady);
    		if ('autoPlay' in $$props) $$invalidate(21, autoPlay = $$props.autoPlay);
    		if ('hideTimer' in $$props) $$invalidate(3, hideTimer = $$props.hideTimer);
    		if ('showControls' in $$props) $$invalidate(4, showControls = $$props.showControls);
    		if ('iconsVisible' in $$props) $$invalidate(5, iconsVisible = $$props.iconsVisible);
    		if ('currentTime' in $$props) $$invalidate(22, currentTime = $$props.currentTime);
    		if ('progressPercentage' in $$props) $$invalidate(7, progressPercentage = $$props.progressPercentage);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*currentTime, $videoMachineRef*/ 4194368) {
    			{
    				$$invalidate(7, progressPercentage = Math.round(currentTime / $videoMachineRef?.context?.vastData?.videoData?.videoDuration * 100) || 0);
    			}
    		}
    	};

    	return [
    		videoMachineRef,
    		experienceType,
    		notReady,
    		hideTimer,
    		showControls,
    		iconsVisible,
    		$videoMachineRef,
    		progressPercentage,
    		onVideoAttached,
    		onVideoPlay,
    		onVideoPause,
    		onVideoEnded,
    		onVideoError,
    		onVideoStop,
    		onVideoTimeUpdate,
    		onVideoQuartile,
    		onVideoShowIcons,
    		videoCTA,
    		controls,
    		onVideoMute,
    		onVideoUnmute,
    		autoPlay,
    		currentTime
    	];
    }

    class VideoWrapper extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init$2(this, options, instance$c, create_fragment$c, safe_not_equal, {
    			videoMachineRef: 0,
    			experienceType: 1,
    			notReady: 2,
    			autoPlay: 21,
    			hideTimer: 3,
    			showControls: 4,
    			iconsVisible: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "VideoWrapper",
    			options,
    			id: create_fragment$c.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*videoMachineRef*/ ctx[0] === undefined && !('videoMachineRef' in props)) {
    			console.warn("<VideoWrapper> was created without expected prop 'videoMachineRef'");
    		}

    		if (/*notReady*/ ctx[2] === undefined && !('notReady' in props)) {
    			console.warn("<VideoWrapper> was created without expected prop 'notReady'");
    		}

    		if (/*autoPlay*/ ctx[21] === undefined && !('autoPlay' in props)) {
    			console.warn("<VideoWrapper> was created without expected prop 'autoPlay'");
    		}

    		if (/*hideTimer*/ ctx[3] === undefined && !('hideTimer' in props)) {
    			console.warn("<VideoWrapper> was created without expected prop 'hideTimer'");
    		}

    		if (/*showControls*/ ctx[4] === undefined && !('showControls' in props)) {
    			console.warn("<VideoWrapper> was created without expected prop 'showControls'");
    		}

    		if (/*iconsVisible*/ ctx[5] === undefined && !('iconsVisible' in props)) {
    			console.warn("<VideoWrapper> was created without expected prop 'iconsVisible'");
    		}
    	}

    	get videoMachineRef() {
    		throw new Error("<VideoWrapper>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set videoMachineRef(value) {
    		throw new Error("<VideoWrapper>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get experienceType() {
    		throw new Error("<VideoWrapper>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set experienceType(value) {
    		throw new Error("<VideoWrapper>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get notReady() {
    		throw new Error("<VideoWrapper>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set notReady(value) {
    		throw new Error("<VideoWrapper>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get autoPlay() {
    		throw new Error("<VideoWrapper>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set autoPlay(value) {
    		throw new Error("<VideoWrapper>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hideTimer() {
    		throw new Error("<VideoWrapper>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hideTimer(value) {
    		throw new Error("<VideoWrapper>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showControls() {
    		throw new Error("<VideoWrapper>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showControls(value) {
    		throw new Error("<VideoWrapper>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get iconsVisible() {
    		throw new Error("<VideoWrapper>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set iconsVisible(value) {
    		throw new Error("<VideoWrapper>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/video/VerticalFramedTemplateBadge.svelte generated by Svelte v3.47.0 */

    const file$9 = "src/components/video/VerticalFramedTemplateBadge.svelte";

    function create_fragment$b(ctx) {
    	let div5;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let t2;
    	let div1;
    	let t4;
    	let div4;
    	let div3;
    	let div2;

    	const block = {
    		c: function create() {
    			div5 = element$1("div");
    			img = element$1("img");
    			t0 = space();
    			div0 = element$1("div");
    			div0.textContent = `${/*metadata*/ ctx[0].title}`;
    			t2 = space();
    			div1 = element$1("div");
    			div1.textContent = `${/*metadata*/ ctx[0].description}`;
    			t4 = space();
    			div4 = element$1("div");
    			div3 = element$1("div");
    			div2 = element$1("div");
    			div2.textContent = "GET";
    			attr_dev(img, "class", "logo svelte-1rycu1a");
    			if (!src_url_equal(img.src, img_src_value = /*metadata*/ ctx[0].iconUrl)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "data-action", "PerfVerticalFramed");
    			attr_dev(img, "alt", "icon");
    			add_location(img, file$9, 9, 2, 127);
    			attr_dev(div0, "class", "framed-title svelte-1rycu1a");
    			add_location(div0, file$9, 15, 2, 235);
    			attr_dev(div1, "class", "desc svelte-1rycu1a");
    			attr_dev(div1, "data-action", "PerfVerticalFramed");
    			add_location(div1, file$9, 19, 2, 295);
    			attr_dev(div2, "class", "logoButtonTtl svelte-1rycu1a");
    			add_location(div2, file$9, 24, 6, 486);
    			attr_dev(div3, "class", "logoButtonDiv svelte-1rycu1a");
    			add_location(div3, file$9, 23, 4, 452);
    			attr_dev(div4, "class", "buttonContainer svelte-1rycu1a");
    			attr_dev(div4, "data-action", "PerfVerticalFramed");
    			add_location(div4, file$9, 22, 2, 385);
    			attr_dev(div5, "class", "vertical-framed-temp svelte-1rycu1a");
    			attr_dev(div5, "id", "perf_exp");
    			attr_dev(div5, "data-action", "PerfVerticalFramed");
    			add_location(div5, file$9, 4, 0, 36);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, img);
    			append_dev(div5, t0);
    			append_dev(div5, div0);
    			append_dev(div5, t2);
    			append_dev(div5, div1);
    			append_dev(div5, t4);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('VerticalFramedTemplateBadge', slots, []);
    	let metadata;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<VerticalFramedTemplateBadge> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ metadata });

    	$$self.$inject_state = $$props => {
    		if ('metadata' in $$props) $$invalidate(0, metadata = $$props.metadata);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [metadata];
    }

    class VerticalFramedTemplateBadge extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$2(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "VerticalFramedTemplateBadge",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src/components/video/perfAlternative/PulsatingButton.svelte generated by Svelte v3.47.0 */

    const file$8 = "src/components/video/perfAlternative/PulsatingButton.svelte";

    function create_fragment$a(ctx) {
    	let div3;
    	let img;
    	let img_src_value;
    	let t0;
    	let div2;
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div3 = element$1("div");
    			img = element$1("img");
    			t0 = space();
    			div2 = element$1("div");
    			div1 = element$1("div");
    			div0 = element$1("div");
    			div0.textContent = "DOWNLOAD";
    			attr_dev(img, "class", "logo svelte-62usow");
    			if (!src_url_equal(img.src, img_src_value = /*iconUrl*/ ctx[0])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "icon");
    			add_location(img, file$8, 5, 2, 113);
    			attr_dev(div0, "class", "logoButtonTtl svelte-62usow");
    			attr_dev(div0, "data-action", "perfAltTempDownload");
    			add_location(div0, file$8, 8, 6, 263);
    			attr_dev(div1, "class", "logoButtonDiv svelte-62usow");
    			attr_dev(div1, "data-action", "perfAltTempDownload");
    			add_location(div1, file$8, 7, 4, 195);
    			attr_dev(div2, "class", "buttonContainer svelte-62usow");
    			add_location(div2, file$8, 6, 2, 161);
    			attr_dev(div3, "class", "perf-alt svelte-62usow");
    			attr_dev(div3, "id", "perf_exp");
    			attr_dev(div3, "data-action", "perfAltTempDownload");
    			add_location(div3, file$8, 4, 0, 40);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, img);
    			append_dev(div3, t0);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('PulsatingButton', slots, []);
    	let iconUrl = "";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<PulsatingButton> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ iconUrl });

    	$$self.$inject_state = $$props => {
    		if ('iconUrl' in $$props) $$invalidate(0, iconUrl = $$props.iconUrl);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [iconUrl];
    }

    class PulsatingButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$2(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PulsatingButton",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src/components/video/perf/DownloadBadge.svelte generated by Svelte v3.47.0 */

    const file$7 = "src/components/video/perf/DownloadBadge.svelte";

    function create_fragment$9(ctx) {
    	let div9;
    	let img;
    	let img_src_value;
    	let t0;
    	let div6;
    	let span;
    	let t2;
    	let div5;
    	let div0;
    	let t4;
    	let div3;
    	let div1;
    	let t5;
    	let div2;
    	let t6;
    	let div4;
    	let t8;
    	let div8;
    	let div7;

    	const block = {
    		c: function create() {
    			div9 = element$1("div");
    			img = element$1("img");
    			t0 = space();
    			div6 = element$1("div");
    			span = element$1("span");
    			span.textContent = `${/*metadata*/ ctx[0].title}`;
    			t2 = space();
    			div5 = element$1("div");
    			div0 = element$1("div");
    			div0.textContent = `${/*metadata*/ ctx[0].rating}`;
    			t4 = space();
    			div3 = element$1("div");
    			div1 = element$1("div");
    			t5 = space();
    			div2 = element$1("div");
    			t6 = space();
    			div4 = element$1("div");
    			div4.textContent = "App store";
    			t8 = space();
    			div8 = element$1("div");
    			div7 = element$1("div");
    			div7.textContent = "DOWNLOAD";
    			if (!src_url_equal(img.src, img_src_value = /*metadata*/ ctx[0].iconUrl)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "logo svelte-l3deyx");
    			attr_dev(img, "alt", "icon");
    			add_location(img, file$7, 5, 2, 81);
    			attr_dev(span, "class", "title svelte-l3deyx");
    			add_location(span, file$7, 7, 4, 169);
    			attr_dev(div0, "clas", "ratingVal");
    			add_location(div0, file$7, 9, 6, 247);
    			attr_dev(div1, "class", "empty-stars");
    			add_location(div1, file$7, 11, 8, 329);
    			attr_dev(div2, "class", "fill-stars");
    			add_location(div2, file$7, 12, 8, 365);
    			attr_dev(div3, "class", "ratings");
    			add_location(div3, file$7, 10, 6, 299);
    			attr_dev(div4, "class", "ratingTitle svelte-l3deyx");
    			add_location(div4, file$7, 14, 6, 411);
    			attr_dev(div5, "class", "ratingDiv svelte-l3deyx");
    			add_location(div5, file$7, 8, 4, 217);
    			attr_dev(div6, "class", "title-rating svelte-l3deyx");
    			add_location(div6, file$7, 6, 2, 138);
    			attr_dev(div7, "class", "buttonTtl svelte-l3deyx");
    			add_location(div7, file$7, 18, 4, 502);
    			attr_dev(div8, "class", "buttonDiv svelte-l3deyx");
    			add_location(div8, file$7, 17, 2, 474);
    			attr_dev(div9, "id", "perf_exp");
    			attr_dev(div9, "class", "perf-base svelte-l3deyx");
    			add_location(div9, file$7, 4, 0, 41);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div9, anchor);
    			append_dev(div9, img);
    			append_dev(div9, t0);
    			append_dev(div9, div6);
    			append_dev(div6, span);
    			append_dev(div6, t2);
    			append_dev(div6, div5);
    			append_dev(div5, div0);
    			append_dev(div5, t4);
    			append_dev(div5, div3);
    			append_dev(div3, div1);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			append_dev(div5, t6);
    			append_dev(div5, div4);
    			append_dev(div9, t8);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div9);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('DownloadBadge', slots, []);
    	let metadata = {};
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<DownloadBadge> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ metadata });

    	$$self.$inject_state = $$props => {
    		if ('metadata' in $$props) $$invalidate(0, metadata = $$props.metadata);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [metadata];
    }

    class DownloadBadge extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$2(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DownloadBadge",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src/components/video/endcard/StaticCompanion.svelte generated by Svelte v3.47.0 */

    const file$6 = "src/components/video/endcard/StaticCompanion.svelte";

    function create_fragment$8(ctx) {
    	let img;
    	let img_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			img = element$1("img");
    			if (!src_url_equal(img.src, img_src_value = /*endCardImageSrc*/ ctx[0])) attr_dev(img, "src", img_src_value);
    			add_location(img, file$6, 5, 0, 81);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);

    			if (!mounted) {
    				dispose = listen_dev(img, "click", /*endcardCTA*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*endCardImageSrc*/ 1 && !src_url_equal(img.src, img_src_value = /*endCardImageSrc*/ ctx[0])) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('StaticCompanion', slots, []);
    	let { endCardImageSrc } = $$props;

    	const endcardCTA = () => {
    		
    	};

    	const writable_props = ['endCardImageSrc'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<StaticCompanion> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('endCardImageSrc' in $$props) $$invalidate(0, endCardImageSrc = $$props.endCardImageSrc);
    	};

    	$$self.$capture_state = () => ({ endCardImageSrc, endcardCTA });

    	$$self.$inject_state = $$props => {
    		if ('endCardImageSrc' in $$props) $$invalidate(0, endCardImageSrc = $$props.endCardImageSrc);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [endCardImageSrc, endcardCTA];
    }

    class StaticCompanion extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$2(this, options, instance$8, create_fragment$8, safe_not_equal, { endCardImageSrc: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StaticCompanion",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*endCardImageSrc*/ ctx[0] === undefined && !('endCardImageSrc' in props)) {
    			console.warn("<StaticCompanion> was created without expected prop 'endCardImageSrc'");
    		}
    	}

    	get endCardImageSrc() {
    		throw new Error("<StaticCompanion>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set endCardImageSrc(value) {
    		throw new Error("<StaticCompanion>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/video/endcard/HTMLCompanion.svelte generated by Svelte v3.47.0 */

    function create_fragment$7(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('HTMLCompanion', slots, []);
    	var testdiv = document.createElement('script');
    	testdiv.innerText = 'function setUpFrame() { \n' + "    var frame = window.frames['endCardHtmlIframe'];\n" + '    frame.getMraid(mraid);\n' + '}';
    	window.document.body.appendChild(testdiv);
    	endCardHtml = '<script>\n ' + 'function getMraid(arg) { mraid = arg}; window.parent.setUpFrame();\n' + '<\\/script>\n' + endCardHtml + '<script type="text/javascript">\n' + "\tdocument.body.addEventListener('click', function() {\n" + '\t\tif(window.parent.fireInmCompanionClickTrackers !== undefined){\n' + '\t\t\twindow.parent.fireInmCompanionClickTrackers()}});\n' + '<\\/script>';
    	element = document.createElement('iframe');
    	element.name = 'endCardHtmlIframe';
    	endCardImage.appendChild(element);
    	element.contentWindow.document.open();
    	element.contentWindow.document.write(endCardHtml);
    	element.contentWindow.document.close();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<HTMLCompanion> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ testdiv });

    	$$self.$inject_state = $$props => {
    		if ('testdiv' in $$props) testdiv = $$props.testdiv;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [];
    }

    class HTMLCompanion extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$2(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "HTMLCompanion",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/components/video/endcard/IFrameCompanion.svelte generated by Svelte v3.47.0 */

    const file$5 = "src/components/video/endcard/IFrameCompanion.svelte";

    function create_fragment$6(ctx) {
    	let iframe;
    	let iframe_src_value;

    	const block = {
    		c: function create() {
    			iframe = element$1("iframe");
    			if (!src_url_equal(iframe.src, iframe_src_value = /*endcardIframeResource*/ ctx[0])) attr_dev(iframe, "src", iframe_src_value);
    			add_location(iframe, file$5, 4, 0, 56);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, iframe, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*endcardIframeResource*/ 1 && !src_url_equal(iframe.src, iframe_src_value = /*endcardIframeResource*/ ctx[0])) {
    				attr_dev(iframe, "src", iframe_src_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(iframe);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('IFrameCompanion', slots, []);
    	let { endcardIframeResource } = $$props;
    	const writable_props = ['endcardIframeResource'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<IFrameCompanion> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('endcardIframeResource' in $$props) $$invalidate(0, endcardIframeResource = $$props.endcardIframeResource);
    	};

    	$$self.$capture_state = () => ({ endcardIframeResource });

    	$$self.$inject_state = $$props => {
    		if ('endcardIframeResource' in $$props) $$invalidate(0, endcardIframeResource = $$props.endcardIframeResource);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [endcardIframeResource];
    }

    class IFrameCompanion extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$2(this, options, instance$6, create_fragment$6, safe_not_equal, { endcardIframeResource: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "IFrameCompanion",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*endcardIframeResource*/ ctx[0] === undefined && !('endcardIframeResource' in props)) {
    			console.warn("<IFrameCompanion> was created without expected prop 'endcardIframeResource'");
    		}
    	}

    	get endcardIframeResource() {
    		throw new Error("<IFrameCompanion>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set endcardIframeResource(value) {
    		throw new Error("<IFrameCompanion>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const SKIP_ICON = "https://supply.inmobicdn.net/assets/skip.svg";
    const CLOSE_ICON = "https://supply.inmobicdn.net/assets/close.svg";
    const CLOSE_ICON_ALT_TEXT = "Close";
    const SKIP_ALL_ICON = "https://supply.inmobicdn.net/assets/skipAllBtn.svg";
    const SPONSORED_AD_CHOICES_ICON = "https://supply.inmobicdn.net/assets/adR.svg";
    const SPONSORED_AD_CHOICES_ICON_ALT_TEXT = "Ad Choices";
    const POPOUT_BUTTON_ICON = "https://supply.inmobicdn.net/assets/popOut.svg";
    const POPOUT_BUTTON_TEXT = '';

    /* src/components/video/experiment/PopoutButton.svelte generated by Svelte v3.47.0 */
    const file$4 = "src/components/video/experiment/PopoutButton.svelte";

    function create_fragment$5(ctx) {
    	let div;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			div = element$1("div");
    			img = element$1("img");
    			if (!src_url_equal(img.src, img_src_value = POPOUT_BUTTON_ICON)) attr_dev(img, "src", img_src_value);
    			set_style(img, "height", "100%");
    			set_style(img, "width", "100%");
    			attr_dev(img, "class", "pulseEffect");
    			attr_dev(img, "data-action", "popOutBtn");
    			attr_dev(img, "alt", POPOUT_BUTTON_TEXT);
    			add_location(img, file$4, 8, 2, 211);
    			attr_dev(div, "id", "popOutBtn");
    			set_style(div, "position", "absolute");
    			set_style(div, "right", "5px");
    			set_style(div, "top", "5px");
    			set_style(div, "width", "50px");
    			set_style(div, "height", "50px");
    			set_style(div, "zIndex", "2147483647");
    			add_location(div, file$4, 4, 0, 97);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('PopoutButton', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<PopoutButton> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ POPOUT_BUTTON_ICON, POPOUT_BUTTON_TEXT });
    	return [];
    }

    class PopoutButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$2(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PopoutButton",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/components/video/endcard/Endcard.svelte generated by Svelte v3.47.0 */

    const { console: console_1 } = globals;
    const file$3 = "src/components/video/endcard/Endcard.svelte";

    // (23:2) {#if !$endcardRef?.matches('show.defaultEndcard')}
    function create_if_block_3(ctx) {
    	let div;
    	let show_if_2 = /*$endcardRef*/ ctx[4]?.matches('show.staticCompanion');
    	let t0;
    	let show_if_1 = /*$endcardRef*/ ctx[4]?.matches('show.HTMLCompanion');
    	let t1;
    	let show_if = /*$endcardRef*/ ctx[4]?.matches('show.iFrameCompanion');
    	let div_id_value;
    	let current;
    	let if_block0 = show_if_2 && create_if_block_6(ctx);
    	let if_block1 = show_if_1 && create_if_block_5(ctx);
    	let if_block2 = show_if && create_if_block_4(ctx);

    	const block = {
    		c: function create() {
    			div = element$1("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			attr_dev(div, "id", div_id_value = `${/*ns*/ ctx[2]}endCardImage`);
    			attr_dev(div, "class", "endCardImage");
    			attr_dev(div, "data-action", "endCardImage");
    			add_location(div, file$3, 23, 4, 833);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t0);
    			if (if_block1) if_block1.m(div, null);
    			append_dev(div, t1);
    			if (if_block2) if_block2.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$endcardRef*/ 16) show_if_2 = /*$endcardRef*/ ctx[4]?.matches('show.staticCompanion');

    			if (show_if_2) {
    				if (if_block0) {
    					if (dirty & /*$endcardRef*/ 16) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_6(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*$endcardRef*/ 16) show_if_1 = /*$endcardRef*/ ctx[4]?.matches('show.HTMLCompanion');

    			if (show_if_1) {
    				if (if_block1) {
    					if (dirty & /*$endcardRef*/ 16) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_5(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div, t1);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*$endcardRef*/ 16) show_if = /*$endcardRef*/ ctx[4]?.matches('show.iFrameCompanion');

    			if (show_if) {
    				if (if_block2) {
    					if (dirty & /*$endcardRef*/ 16) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_4(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div, null);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*ns*/ 4 && div_id_value !== (div_id_value = `${/*ns*/ ctx[2]}endCardImage`)) {
    				attr_dev(div, "id", div_id_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(23:2) {#if !$endcardRef?.matches('show.defaultEndcard')}",
    		ctx
    	});

    	return block;
    }

    // (29:6) {#if $endcardRef?.matches('show.staticCompanion')}
    function create_if_block_6(ctx) {
    	let staticcompanion;
    	let current;
    	staticcompanion = new StaticCompanion({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(staticcompanion.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(staticcompanion, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(staticcompanion.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(staticcompanion.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(staticcompanion, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(29:6) {#if $endcardRef?.matches('show.staticCompanion')}",
    		ctx
    	});

    	return block;
    }

    // (32:6) {#if $endcardRef?.matches('show.HTMLCompanion')}
    function create_if_block_5(ctx) {
    	let htmlcompanion;
    	let current;
    	htmlcompanion = new HTMLCompanion({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(htmlcompanion.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(htmlcompanion, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(htmlcompanion.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(htmlcompanion.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(htmlcompanion, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(32:6) {#if $endcardRef?.matches('show.HTMLCompanion')}",
    		ctx
    	});

    	return block;
    }

    // (35:6) {#if $endcardRef?.matches('show.iFrameCompanion')}
    function create_if_block_4(ctx) {
    	let iframecompanion;
    	let current;
    	iframecompanion = new IFrameCompanion({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(iframecompanion.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(iframecompanion, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(iframecompanion.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(iframecompanion.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(iframecompanion, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(35:6) {#if $endcardRef?.matches('show.iFrameCompanion')}",
    		ctx
    	});

    	return block;
    }

    // (48:2) {#if $endcardRef?.matches('show.defaultEndcard')}
    function create_if_block_2(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let div2_id_value;

    	const block = {
    		c: function create() {
    			div2 = element$1("div");
    			div1 = element$1("div");
    			div0 = element$1("div");
    			div0.textContent = "LEARN MORE";
    			attr_dev(div0, "class", "buttonTtl");
    			attr_dev(div0, "data-action", "endCardCta");
    			add_location(div0, file$3, 54, 8, 1628);
    			attr_dev(div1, "class", "buttonDiv");
    			attr_dev(div1, "data-action", "endCardCta");
    			add_location(div1, file$3, 53, 6, 1571);
    			attr_dev(div2, "class", "fabricated-card");
    			attr_dev(div2, "id", div2_id_value = `${/*ns*/ ctx[2]}endCardCtaBtn`);
    			attr_dev(div2, "data-action", "endCardCta");
    			add_location(div2, file$3, 48, 4, 1461);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*ns*/ 4 && div2_id_value !== (div2_id_value = `${/*ns*/ ctx[2]}endCardCtaBtn`)) {
    				attr_dev(div2, "id", div2_id_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(48:2) {#if $endcardRef?.matches('show.defaultEndcard')}",
    		ctx
    	});

    	return block;
    }

    // (62:39) 
    function create_if_block_1$1(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(62:39) ",
    		ctx
    	});

    	return block;
    }

    // (60:2) {#if rvCloseButtonExperimentEnabled && experienceType === 'HighCTR'}
    function create_if_block$2(ctx) {
    	let popoutbutton;
    	let current;
    	popoutbutton = new PopoutButton({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(popoutbutton.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(popoutbutton, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(popoutbutton.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(popoutbutton.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(popoutbutton, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(60:2) {#if rvCloseButtonExperimentEnabled && experienceType === 'HighCTR'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div1;
    	let show_if_1 = !/*$endcardRef*/ ctx[4]?.matches('show.defaultEndcard');
    	let t0;
    	let div0;
    	let div0_id_value;
    	let t1;
    	let show_if = /*$endcardRef*/ ctx[4]?.matches('show.defaultEndcard');
    	let t2;
    	let current_block_type_index;
    	let if_block2;
    	let div1_id_value;
    	let current;
    	let if_block0 = show_if_1 && create_if_block_3(ctx);
    	let if_block1 = show_if && create_if_block_2(ctx);
    	const if_block_creators = [create_if_block$2, create_if_block_1$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*rvCloseButtonExperimentEnabled*/ ctx[3] && /*experienceType*/ ctx[1] === 'HighCTR') return 0;
    		if (/*experienceType*/ ctx[1] !== 'Basic') return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block2 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			div1 = element$1("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			div0 = element$1("div");
    			t1 = space();
    			if (if_block1) if_block1.c();
    			t2 = space();
    			if (if_block2) if_block2.c();
    			attr_dev(div0, "id", div0_id_value = `${/*ns*/ ctx[2]}endCardBackground`);
    			attr_dev(div0, "class", "endCardBackground hide");
    			attr_dev(div0, "data-action", "endCardBackground");
    			add_location(div0, file$3, 41, 2, 1289);
    			attr_dev(div1, "id", div1_id_value = `${/*ns*/ ctx[2]}ad_pg2`);
    			attr_dev(div1, "class", "ad_pg2");
    			add_location(div1, file$3, 21, 0, 736);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div1, t1);
    			if (if_block1) if_block1.m(div1, null);
    			append_dev(div1, t2);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(div1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$endcardRef*/ 16) show_if_1 = !/*$endcardRef*/ ctx[4]?.matches('show.defaultEndcard');

    			if (show_if_1) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*$endcardRef*/ 16) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div1, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*ns*/ 4 && div0_id_value !== (div0_id_value = `${/*ns*/ ctx[2]}endCardBackground`)) {
    				attr_dev(div0, "id", div0_id_value);
    			}

    			if (dirty & /*$endcardRef*/ 16) show_if = /*$endcardRef*/ ctx[4]?.matches('show.defaultEndcard');

    			if (show_if) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					if_block1.m(div1, t2);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				if (if_block2) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block2 = if_blocks[current_block_type_index];

    					if (!if_block2) {
    						if_block2 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block2.c();
    					}

    					transition_in(if_block2, 1);
    					if_block2.m(div1, null);
    				} else {
    					if_block2 = null;
    				}
    			}

    			if (!current || dirty & /*ns*/ 4 && div1_id_value !== (div1_id_value = `${/*ns*/ ctx[2]}ad_pg2`)) {
    				attr_dev(div1, "id", div1_id_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $endcardRef,
    		$$unsubscribe_endcardRef = noop,
    		$$subscribe_endcardRef = () => ($$unsubscribe_endcardRef(), $$unsubscribe_endcardRef = subscribe(endcardRef, $$value => $$invalidate(4, $endcardRef = $$value)), endcardRef);

    	$$self.$$.on_destroy.push(() => $$unsubscribe_endcardRef());
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Endcard', slots, []);
    	let { endcardRef } = $$props;
    	validate_store(endcardRef, 'endcardRef');
    	$$subscribe_endcardRef();
    	let { experienceType } = $$props;
    	let { ns } = $$props;
    	let { metadata } = $$props;
    	let { iconUrl } = $$props;
    	let { rvCloseButtonExperimentEnabled } = $$props;

    	const writable_props = [
    		'endcardRef',
    		'experienceType',
    		'ns',
    		'metadata',
    		'iconUrl',
    		'rvCloseButtonExperimentEnabled'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Endcard> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('endcardRef' in $$props) $$subscribe_endcardRef($$invalidate(0, endcardRef = $$props.endcardRef));
    		if ('experienceType' in $$props) $$invalidate(1, experienceType = $$props.experienceType);
    		if ('ns' in $$props) $$invalidate(2, ns = $$props.ns);
    		if ('metadata' in $$props) $$invalidate(5, metadata = $$props.metadata);
    		if ('iconUrl' in $$props) $$invalidate(6, iconUrl = $$props.iconUrl);
    		if ('rvCloseButtonExperimentEnabled' in $$props) $$invalidate(3, rvCloseButtonExperimentEnabled = $$props.rvCloseButtonExperimentEnabled);
    	};

    	$$self.$capture_state = () => ({
    		VerticalFramedTemplateBadge,
    		PulsatingButton,
    		DownloadBadge,
    		StaticCompanion,
    		HTMLCompanion,
    		IFrameCompanion,
    		PopoutButton,
    		endcardRef,
    		experienceType,
    		ns,
    		metadata,
    		iconUrl,
    		rvCloseButtonExperimentEnabled,
    		$endcardRef
    	});

    	$$self.$inject_state = $$props => {
    		if ('endcardRef' in $$props) $$subscribe_endcardRef($$invalidate(0, endcardRef = $$props.endcardRef));
    		if ('experienceType' in $$props) $$invalidate(1, experienceType = $$props.experienceType);
    		if ('ns' in $$props) $$invalidate(2, ns = $$props.ns);
    		if ('metadata' in $$props) $$invalidate(5, metadata = $$props.metadata);
    		if ('iconUrl' in $$props) $$invalidate(6, iconUrl = $$props.iconUrl);
    		if ('rvCloseButtonExperimentEnabled' in $$props) $$invalidate(3, rvCloseButtonExperimentEnabled = $$props.rvCloseButtonExperimentEnabled);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*endcardRef, $endcardRef*/ 17) {
    			{
    				console.log(endcardRef);
    				console.log($endcardRef?.matches('show.defaultEndcard'));
    			}
    		}
    	};

    	return [
    		endcardRef,
    		experienceType,
    		ns,
    		rvCloseButtonExperimentEnabled,
    		$endcardRef,
    		metadata,
    		iconUrl
    	];
    }

    class Endcard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init$2(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			endcardRef: 0,
    			experienceType: 1,
    			ns: 2,
    			metadata: 5,
    			iconUrl: 6,
    			rvCloseButtonExperimentEnabled: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Endcard",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*endcardRef*/ ctx[0] === undefined && !('endcardRef' in props)) {
    			console_1.warn("<Endcard> was created without expected prop 'endcardRef'");
    		}

    		if (/*experienceType*/ ctx[1] === undefined && !('experienceType' in props)) {
    			console_1.warn("<Endcard> was created without expected prop 'experienceType'");
    		}

    		if (/*ns*/ ctx[2] === undefined && !('ns' in props)) {
    			console_1.warn("<Endcard> was created without expected prop 'ns'");
    		}

    		if (/*metadata*/ ctx[5] === undefined && !('metadata' in props)) {
    			console_1.warn("<Endcard> was created without expected prop 'metadata'");
    		}

    		if (/*iconUrl*/ ctx[6] === undefined && !('iconUrl' in props)) {
    			console_1.warn("<Endcard> was created without expected prop 'iconUrl'");
    		}

    		if (/*rvCloseButtonExperimentEnabled*/ ctx[3] === undefined && !('rvCloseButtonExperimentEnabled' in props)) {
    			console_1.warn("<Endcard> was created without expected prop 'rvCloseButtonExperimentEnabled'");
    		}
    	}

    	get endcardRef() {
    		throw new Error("<Endcard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set endcardRef(value) {
    		throw new Error("<Endcard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get experienceType() {
    		throw new Error("<Endcard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set experienceType(value) {
    		throw new Error("<Endcard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ns() {
    		throw new Error("<Endcard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ns(value) {
    		throw new Error("<Endcard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get metadata() {
    		throw new Error("<Endcard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set metadata(value) {
    		throw new Error("<Endcard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get iconUrl() {
    		throw new Error("<Endcard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set iconUrl(value) {
    		throw new Error("<Endcard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rvCloseButtonExperimentEnabled() {
    		throw new Error("<Endcard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rvCloseButtonExperimentEnabled(value) {
    		throw new Error("<Endcard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/video/Adpage.svelte generated by Svelte v3.47.0 */
    const file$2 = "src/components/video/Adpage.svelte";

    // (24:2) {#if !$endcardRef?.matches('show')}
    function create_if_block_1(ctx) {
    	let div3;
    	let div0;
    	let videowrapper;
    	let t;
    	let div2;
    	let div1;
    	let img;
    	let img_src_value;
    	let current;

    	videowrapper = new VideoWrapper({
    			props: {
    				videoMachineRef: /*videoMachineRef*/ ctx[4],
    				autoPlay: true
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div3 = element$1("div");
    			div0 = element$1("div");
    			create_component(videowrapper.$$.fragment);
    			t = space();
    			div2 = element$1("div");
    			div1 = element$1("div");
    			img = element$1("img");
    			attr_dev(div0, "id", "video_div");
    			attr_dev(div0, "class", "block-1 svelte-1cfx1wq");
    			set_style(div0, "height", "100px");
    			set_style(div0, "width", "100px");
    			add_location(div0, file$2, 25, 6, 779);
    			attr_dev(img, "class", "cta-img");
    			if (!src_url_equal(img.src, img_src_value = "")) attr_dev(img, "src", img_src_value);
    			add_location(img, file$2, 40, 10, 1323);
    			attr_dev(div1, "class", "cta-btn");
    			attr_dev(div1, "id", "cta-btn");
    			add_location(div1, file$2, 39, 8, 1278);
    			attr_dev(div2, "id", `${/*ns*/ ctx[3]}video_cta`);
    			attr_dev(div2, "class", "block-2 hide svelte-1cfx1wq");
    			attr_dev(div2, "data-action", "videoCta");
    			add_location(div2, file$2, 38, 6, 1198);
    			attr_dev(div3, "id", "ad_pg1");
    			attr_dev(div3, "class", "ad_pg1");
    			add_location(div3, file$2, 24, 4, 740);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			mount_component(videowrapper, div0, null);
    			append_dev(div3, t);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, img);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(videowrapper.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(videowrapper.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_component(videowrapper);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(24:2) {#if !$endcardRef?.matches('show')}",
    		ctx
    	});

    	return block;
    }

    // (47:2) {#if $endcardRef?.matches('show')}
    function create_if_block$1(ctx) {
    	let endcard;
    	let current;

    	endcard = new Endcard({
    			props: {
    				endcardRef: /*endcardRef*/ ctx[0],
    				experienceType: /*experienceType*/ ctx[2],
    				ns: /*ns*/ ctx[3],
    				metadata: /*metadata*/ ctx[5]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(endcard.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(endcard, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const endcard_changes = {};
    			if (dirty & /*endcardRef*/ 1) endcard_changes.endcardRef = /*endcardRef*/ ctx[0];
    			endcard.$set(endcard_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(endcard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(endcard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(endcard, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(47:2) {#if $endcardRef?.matches('show')}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let show_if_1 = !/*$endcardRef*/ ctx[1]?.matches('show');
    	let t;
    	let show_if = /*$endcardRef*/ ctx[1]?.matches('show');
    	let current;
    	let if_block0 = show_if_1 && create_if_block_1(ctx);
    	let if_block1 = show_if && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div = element$1("div");
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			attr_dev(div, "id", "adPage");
    			attr_dev(div, "class", "pod-ad");
    			add_location(div, file$2, 22, 0, 665);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t);
    			if (if_block1) if_block1.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$endcardRef*/ 2) show_if_1 = !/*$endcardRef*/ ctx[1]?.matches('show');

    			if (show_if_1) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*$endcardRef*/ 2) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div, t);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*$endcardRef*/ 2) show_if = /*$endcardRef*/ ctx[1]?.matches('show');

    			if (show_if) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*$endcardRef*/ 2) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $endcardRef,
    		$$unsubscribe_endcardRef = noop,
    		$$subscribe_endcardRef = () => ($$unsubscribe_endcardRef(), $$unsubscribe_endcardRef = subscribe(endcardRef, $$value => $$invalidate(1, $endcardRef = $$value)), endcardRef);

    	$$self.$$.on_destroy.push(() => $$unsubscribe_endcardRef());
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Adpage', slots, []);
    	let { pod = {} } = $$props;
    	let { endcardRef } = $$props;
    	validate_store(endcardRef, 'endcardRef');
    	$$subscribe_endcardRef();
    	let isSdkPods = false;
    	let ctrSrc = '';
    	let experienceType = 'BrandBase';
    	let ns = pod?.ns;
    	const videoMachineRef = pod?.ref;
    	let metadata;

    	let ctaButtonSrcForSdkPods = experienceType === 'Perf'
    	? 'https://videoassets41.blob.core.windows.net/assets/green_CTA.png'
    	: 'https://i.l.inmobicdn.net/ifctpads/IFC/CCN/assets/know-more1_1511909817.png';

    	let ctaButtonImgSrc = isSdkPods ? ctaButtonSrcForSdkPods : ctrSrc;
    	let iconUrl = '';

    	const vpaidCTA = () => {
    		
    	};

    	const writable_props = ['pod', 'endcardRef'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Adpage> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('pod' in $$props) $$invalidate(6, pod = $$props.pod);
    		if ('endcardRef' in $$props) $$subscribe_endcardRef($$invalidate(0, endcardRef = $$props.endcardRef));
    	};

    	$$self.$capture_state = () => ({
    		VideoWrapper,
    		EndCard: Endcard,
    		pod,
    		endcardRef,
    		isSdkPods,
    		ctrSrc,
    		experienceType,
    		ns,
    		videoMachineRef,
    		metadata,
    		ctaButtonSrcForSdkPods,
    		ctaButtonImgSrc,
    		iconUrl,
    		vpaidCTA,
    		$endcardRef
    	});

    	$$self.$inject_state = $$props => {
    		if ('pod' in $$props) $$invalidate(6, pod = $$props.pod);
    		if ('endcardRef' in $$props) $$subscribe_endcardRef($$invalidate(0, endcardRef = $$props.endcardRef));
    		if ('isSdkPods' in $$props) isSdkPods = $$props.isSdkPods;
    		if ('ctrSrc' in $$props) ctrSrc = $$props.ctrSrc;
    		if ('experienceType' in $$props) $$invalidate(2, experienceType = $$props.experienceType);
    		if ('ns' in $$props) $$invalidate(3, ns = $$props.ns);
    		if ('metadata' in $$props) $$invalidate(5, metadata = $$props.metadata);
    		if ('ctaButtonSrcForSdkPods' in $$props) ctaButtonSrcForSdkPods = $$props.ctaButtonSrcForSdkPods;
    		if ('ctaButtonImgSrc' in $$props) ctaButtonImgSrc = $$props.ctaButtonImgSrc;
    		if ('iconUrl' in $$props) iconUrl = $$props.iconUrl;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [endcardRef, $endcardRef, experienceType, ns, videoMachineRef, metadata, pod];
    }

    class Adpage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$2(this, options, instance$3, create_fragment$3, safe_not_equal, { pod: 6, endcardRef: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Adpage",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*endcardRef*/ ctx[0] === undefined && !('endcardRef' in props)) {
    			console.warn("<Adpage> was created without expected prop 'endcardRef'");
    		}
    	}

    	get pod() {
    		throw new Error("<Adpage>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pod(value) {
    		throw new Error("<Adpage>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get endcardRef() {
    		throw new Error("<Adpage>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set endcardRef(value) {
    		throw new Error("<Adpage>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    var __assign$1 = function() {
        __assign$1 = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign$1.apply(this, arguments);
    };

    function __rest(s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    }

    function __values$1(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m) return m.call(o);
        if (o && typeof o.length === "number") return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }

    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    }

    function __spreadArray(to, from, pack) {
        if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
            if (ar || !(i in from)) {
                if (!ar) ar = Array.prototype.slice.call(from, 0, i);
                ar[i] = from[i];
            }
        }
        return to.concat(ar || Array.prototype.slice.call(from));
    }

    var ActionTypes;

    (function (ActionTypes) {
      ActionTypes["Start"] = "xstate.start";
      ActionTypes["Stop"] = "xstate.stop";
      ActionTypes["Raise"] = "xstate.raise";
      ActionTypes["Send"] = "xstate.send";
      ActionTypes["Cancel"] = "xstate.cancel";
      ActionTypes["NullEvent"] = "";
      ActionTypes["Assign"] = "xstate.assign";
      ActionTypes["After"] = "xstate.after";
      ActionTypes["DoneState"] = "done.state";
      ActionTypes["DoneInvoke"] = "done.invoke";
      ActionTypes["Log"] = "xstate.log";
      ActionTypes["Init"] = "xstate.init";
      ActionTypes["Invoke"] = "xstate.invoke";
      ActionTypes["ErrorExecution"] = "error.execution";
      ActionTypes["ErrorCommunication"] = "error.communication";
      ActionTypes["ErrorPlatform"] = "error.platform";
      ActionTypes["ErrorCustom"] = "xstate.error";
      ActionTypes["Update"] = "xstate.update";
      ActionTypes["Pure"] = "xstate.pure";
      ActionTypes["Choose"] = "xstate.choose";
    })(ActionTypes || (ActionTypes = {}));

    var SpecialTargets;

    (function (SpecialTargets) {
      SpecialTargets["Parent"] = "#_parent";
      SpecialTargets["Internal"] = "#_internal";
    })(SpecialTargets || (SpecialTargets = {}));

    var start$2 = ActionTypes.Start;
    var stop$2 = ActionTypes.Stop;
    var raise$2 = ActionTypes.Raise;
    var send$3 = ActionTypes.Send;
    var cancel$2 = ActionTypes.Cancel;
    var nullEvent$1 = ActionTypes.NullEvent;
    var assign$3 = ActionTypes.Assign;
    ActionTypes.After;
    ActionTypes.DoneState;
    var log$1 = ActionTypes.Log;
    var init$1 = ActionTypes.Init;
    var invoke$1 = ActionTypes.Invoke;
    ActionTypes.ErrorExecution;
    var errorPlatform$1 = ActionTypes.ErrorPlatform;
    var error$2 = ActionTypes.ErrorCustom;
    var update$1 = ActionTypes.Update;
    var choose$1 = ActionTypes.Choose;
    var pure$1 = ActionTypes.Pure;

    var STATE_DELIMITER$1 = '.';
    var EMPTY_ACTIVITY_MAP$1 = {};
    var DEFAULT_GUARD_TYPE$1 = 'xstate.guard';
    var TARGETLESS_KEY$1 = '';

    var IS_PRODUCTION$1 = undefined === 'production';

    var _a;
    function matchesState(parentStateId, childStateId, delimiter) {
      if (delimiter === void 0) {
        delimiter = STATE_DELIMITER$1;
      }

      var parentStateValue = toStateValue(parentStateId, delimiter);
      var childStateValue = toStateValue(childStateId, delimiter);

      if (isString$1(childStateValue)) {
        if (isString$1(parentStateValue)) {
          return childStateValue === parentStateValue;
        } // Parent more specific than child


        return false;
      }

      if (isString$1(parentStateValue)) {
        return parentStateValue in childStateValue;
      }

      return Object.keys(parentStateValue).every(function (key) {
        if (!(key in childStateValue)) {
          return false;
        }

        return matchesState(parentStateValue[key], childStateValue[key]);
      });
    }
    function getEventType(event) {
      try {
        return isString$1(event) || typeof event === 'number' ? "".concat(event) : event.type;
      } catch (e) {
        throw new Error('Events must be strings or objects with a string event.type property.');
      }
    }
    function toStatePath(stateId, delimiter) {
      try {
        if (isArray$1(stateId)) {
          return stateId;
        }

        return stateId.toString().split(delimiter);
      } catch (e) {
        throw new Error("'".concat(stateId, "' is not a valid state path."));
      }
    }
    function isStateLike(state) {
      return typeof state === 'object' && 'value' in state && 'context' in state && 'event' in state && '_event' in state;
    }
    function toStateValue(stateValue, delimiter) {
      if (isStateLike(stateValue)) {
        return stateValue.value;
      }

      if (isArray$1(stateValue)) {
        return pathToStateValue(stateValue);
      }

      if (typeof stateValue !== 'string') {
        return stateValue;
      }

      var statePath = toStatePath(stateValue, delimiter);
      return pathToStateValue(statePath);
    }
    function pathToStateValue(statePath) {
      if (statePath.length === 1) {
        return statePath[0];
      }

      var value = {};
      var marker = value;

      for (var i = 0; i < statePath.length - 1; i++) {
        if (i === statePath.length - 2) {
          marker[statePath[i]] = statePath[i + 1];
        } else {
          marker[statePath[i]] = {};
          marker = marker[statePath[i]];
        }
      }

      return value;
    }
    function mapValues(collection, iteratee) {
      var result = {};
      var collectionKeys = Object.keys(collection);

      for (var i = 0; i < collectionKeys.length; i++) {
        var key = collectionKeys[i];
        result[key] = iteratee(collection[key], key, collection, i);
      }

      return result;
    }
    function mapFilterValues(collection, iteratee, predicate) {
      var e_1, _a;

      var result = {};

      try {
        for (var _b = __values$1(Object.keys(collection)), _c = _b.next(); !_c.done; _c = _b.next()) {
          var key = _c.value;
          var item = collection[key];

          if (!predicate(item)) {
            continue;
          }

          result[key] = iteratee(item, key, collection);
        }
      } catch (e_1_1) {
        e_1 = {
          error: e_1_1
        };
      } finally {
        try {
          if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        } finally {
          if (e_1) throw e_1.error;
        }
      }

      return result;
    }
    /**
     * Retrieves a value at the given path.
     * @param props The deep path to the prop of the desired value
     */

    var path = function (props) {
      return function (object) {
        var e_2, _a;

        var result = object;

        try {
          for (var props_1 = __values$1(props), props_1_1 = props_1.next(); !props_1_1.done; props_1_1 = props_1.next()) {
            var prop = props_1_1.value;
            result = result[prop];
          }
        } catch (e_2_1) {
          e_2 = {
            error: e_2_1
          };
        } finally {
          try {
            if (props_1_1 && !props_1_1.done && (_a = props_1.return)) _a.call(props_1);
          } finally {
            if (e_2) throw e_2.error;
          }
        }

        return result;
      };
    };
    /**
     * Retrieves a value at the given path via the nested accessor prop.
     * @param props The deep path to the prop of the desired value
     */

    function nestedPath(props, accessorProp) {
      return function (object) {
        var e_3, _a;

        var result = object;

        try {
          for (var props_2 = __values$1(props), props_2_1 = props_2.next(); !props_2_1.done; props_2_1 = props_2.next()) {
            var prop = props_2_1.value;
            result = result[accessorProp][prop];
          }
        } catch (e_3_1) {
          e_3 = {
            error: e_3_1
          };
        } finally {
          try {
            if (props_2_1 && !props_2_1.done && (_a = props_2.return)) _a.call(props_2);
          } finally {
            if (e_3) throw e_3.error;
          }
        }

        return result;
      };
    }
    function toStatePaths(stateValue) {
      if (!stateValue) {
        return [[]];
      }

      if (isString$1(stateValue)) {
        return [[stateValue]];
      }

      var result = flatten(Object.keys(stateValue).map(function (key) {
        var subStateValue = stateValue[key];

        if (typeof subStateValue !== 'string' && (!subStateValue || !Object.keys(subStateValue).length)) {
          return [[key]];
        }

        return toStatePaths(stateValue[key]).map(function (subPath) {
          return [key].concat(subPath);
        });
      }));
      return result;
    }
    function flatten(array) {
      var _a;

      return (_a = []).concat.apply(_a, __spreadArray([], __read(array), false));
    }
    function toArrayStrict(value) {
      if (isArray$1(value)) {
        return value;
      }

      return [value];
    }
    function toArray(value) {
      if (value === undefined) {
        return [];
      }

      return toArrayStrict(value);
    }
    function mapContext(mapper, context, _event) {
      var e_5, _a;

      if (isFunction$1(mapper)) {
        return mapper(context, _event.data);
      }

      var result = {};

      try {
        for (var _b = __values$1(Object.keys(mapper)), _c = _b.next(); !_c.done; _c = _b.next()) {
          var key = _c.value;
          var subMapper = mapper[key];

          if (isFunction$1(subMapper)) {
            result[key] = subMapper(context, _event.data);
          } else {
            result[key] = subMapper;
          }
        }
      } catch (e_5_1) {
        e_5 = {
          error: e_5_1
        };
      } finally {
        try {
          if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        } finally {
          if (e_5) throw e_5.error;
        }
      }

      return result;
    }
    function isBuiltInEvent(eventType) {
      return /^(done|error)\./.test(eventType);
    }
    function isPromiseLike(value) {
      if (value instanceof Promise) {
        return true;
      } // Check if shape matches the Promise/A+ specification for a "thenable".


      if (value !== null && (isFunction$1(value) || typeof value === 'object') && isFunction$1(value.then)) {
        return true;
      }

      return false;
    }
    function isBehavior(value) {
      return value !== null && typeof value === 'object' && 'transition' in value && typeof value.transition === 'function';
    }
    function partition(items, predicate) {
      var e_6, _a;

      var _b = __read([[], []], 2),
          truthy = _b[0],
          falsy = _b[1];

      try {
        for (var items_1 = __values$1(items), items_1_1 = items_1.next(); !items_1_1.done; items_1_1 = items_1.next()) {
          var item = items_1_1.value;

          if (predicate(item)) {
            truthy.push(item);
          } else {
            falsy.push(item);
          }
        }
      } catch (e_6_1) {
        e_6 = {
          error: e_6_1
        };
      } finally {
        try {
          if (items_1_1 && !items_1_1.done && (_a = items_1.return)) _a.call(items_1);
        } finally {
          if (e_6) throw e_6.error;
        }
      }

      return [truthy, falsy];
    }
    function updateHistoryStates(hist, stateValue) {
      return mapValues(hist.states, function (subHist, key) {
        if (!subHist) {
          return undefined;
        }

        var subStateValue = (isString$1(stateValue) ? undefined : stateValue[key]) || (subHist ? subHist.current : undefined);

        if (!subStateValue) {
          return undefined;
        }

        return {
          current: subStateValue,
          states: updateHistoryStates(subHist, subStateValue)
        };
      });
    }
    function updateHistoryValue(hist, stateValue) {
      return {
        current: stateValue,
        states: updateHistoryStates(hist, stateValue)
      };
    }
    function updateContext(context, _event, assignActions, state) {
      {
        warn(!!context, 'Attempting to update undefined context');
      }

      var updatedContext = context ? assignActions.reduce(function (acc, assignAction) {
        var e_7, _a;

        var assignment = assignAction.assignment;
        var meta = {
          state: state,
          action: assignAction,
          _event: _event
        };
        var partialUpdate = {};

        if (isFunction$1(assignment)) {
          partialUpdate = assignment(acc, _event.data, meta);
        } else {
          try {
            for (var _b = __values$1(Object.keys(assignment)), _c = _b.next(); !_c.done; _c = _b.next()) {
              var key = _c.value;
              var propAssignment = assignment[key];
              partialUpdate[key] = isFunction$1(propAssignment) ? propAssignment(acc, _event.data, meta) : propAssignment;
            }
          } catch (e_7_1) {
            e_7 = {
              error: e_7_1
            };
          } finally {
            try {
              if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            } finally {
              if (e_7) throw e_7.error;
            }
          }
        }

        return Object.assign({}, acc, partialUpdate);
      }, context) : context;
      return updatedContext;
    } // tslint:disable-next-line:no-empty

    var warn = function () {};

    {
      warn = function (condition, message) {
        var error = condition instanceof Error ? condition : undefined;

        if (!error && condition) {
          return;
        }

        if (console !== undefined) {
          var args = ["Warning: ".concat(message)];

          if (error) {
            args.push(error);
          } // tslint:disable-next-line:no-console


          console.warn.apply(console, args);
        }
      };
    }
    function isArray$1(value) {
      return Array.isArray(value);
    } // tslint:disable-next-line:ban-types

    function isFunction$1(value) {
      return typeof value === 'function';
    }
    function isString$1(value) {
      return typeof value === 'string';
    }
    function toGuard(condition, guardMap) {
      if (!condition) {
        return undefined;
      }

      if (isString$1(condition)) {
        return {
          type: DEFAULT_GUARD_TYPE$1,
          name: condition,
          predicate: guardMap ? guardMap[condition] : undefined
        };
      }

      if (isFunction$1(condition)) {
        return {
          type: DEFAULT_GUARD_TYPE$1,
          name: condition.name,
          predicate: condition
        };
      }

      return condition;
    }
    function isObservable(value) {
      try {
        return 'subscribe' in value && isFunction$1(value.subscribe);
      } catch (e) {
        return false;
      }
    }
    var symbolObservable = /*#__PURE__*/function () {
      return typeof Symbol === 'function' && Symbol.observable || '@@observable';
    }(); // TODO: to be removed in v5, left it out just to minimize the scope of the change and maintain compatibility with older versions of integration paackages

    (_a = {}, _a[symbolObservable] = function () {
      return this;
    }, _a[Symbol.observable] = function () {
      return this;
    }, _a);
    function isMachine(value) {
      return !!value && '__xstatenode' in value;
    }
    function isActor$1(value) {
      return !!value && typeof value.send === 'function';
    }
    var uniqueId = /*#__PURE__*/function () {
      var currentId = 0;
      return function () {
        currentId++;
        return currentId.toString(16);
      };
    }();
    function toEventObject(event, payload // id?: TEvent['type']
    ) {
      if (isString$1(event) || typeof event === 'number') {
        return __assign$1({
          type: event
        }, payload);
      }

      return event;
    }
    function toSCXMLEvent(event, scxmlEvent) {
      if (!isString$1(event) && '$$type' in event && event.$$type === 'scxml') {
        return event;
      }

      var eventObject = toEventObject(event);
      return __assign$1({
        name: eventObject.type,
        data: eventObject,
        $$type: 'scxml',
        type: 'external'
      }, scxmlEvent);
    }
    function toTransitionConfigArray(event, configLike) {
      var transitions = toArrayStrict(configLike).map(function (transitionLike) {
        if (typeof transitionLike === 'undefined' || typeof transitionLike === 'string' || isMachine(transitionLike)) {
          return {
            target: transitionLike,
            event: event
          };
        }

        return __assign$1(__assign$1({}, transitionLike), {
          event: event
        });
      });
      return transitions;
    }
    function normalizeTarget(target) {
      if (target === undefined || target === TARGETLESS_KEY$1) {
        return undefined;
      }

      return toArray(target);
    }
    function reportUnhandledExceptionOnInvocation(originalError, currentError, id) {
      {
        var originalStackTrace = originalError.stack ? " Stacktrace was '".concat(originalError.stack, "'") : '';

        if (originalError === currentError) {
          // tslint:disable-next-line:no-console
          console.error("Missing onError handler for invocation '".concat(id, "', error was '").concat(originalError, "'.").concat(originalStackTrace));
        } else {
          var stackTrace = currentError.stack ? " Stacktrace was '".concat(currentError.stack, "'") : ''; // tslint:disable-next-line:no-console

          console.error("Missing onError handler and/or unhandled exception/promise rejection for invocation '".concat(id, "'. ") + "Original error: '".concat(originalError, "'. ").concat(originalStackTrace, " Current error is '").concat(currentError, "'.").concat(stackTrace));
        }
      }
    }
    function evaluateGuard(machine, guard, context, _event, state) {
      var guards = machine.options.guards;
      var guardMeta = {
        state: state,
        cond: guard,
        _event: _event
      }; // TODO: do not hardcode!

      if (guard.type === DEFAULT_GUARD_TYPE$1) {
        return ((guards === null || guards === void 0 ? void 0 : guards[guard.name]) || guard.predicate)(context, _event.data, guardMeta);
      }

      var condFn = guards === null || guards === void 0 ? void 0 : guards[guard.type];

      if (!condFn) {
        throw new Error("Guard '".concat(guard.type, "' is not implemented on machine '").concat(machine.id, "'."));
      }

      return condFn(context, _event.data, guardMeta);
    }
    function toInvokeSource$1(src) {
      if (typeof src === 'string') {
        return {
          type: src
        };
      }

      return src;
    }
    function toObserver(nextHandler, errorHandler, completionHandler) {
      if (typeof nextHandler === 'object') {
        return nextHandler;
      }

      var noop = function () {
        return void 0;
      };

      return {
        next: nextHandler,
        error: errorHandler || noop,
        complete: completionHandler || noop
      };
    }
    function createInvokeId(stateNodeId, index) {
      return "".concat(stateNodeId, ":invocation[").concat(index, "]");
    }

    var initEvent = /*#__PURE__*/toSCXMLEvent({
      type: init$1
    });
    function getActionFunction(actionType, actionFunctionMap) {
      return actionFunctionMap ? actionFunctionMap[actionType] || undefined : undefined;
    }
    function toActionObject(action, actionFunctionMap) {
      var actionObject;

      if (isString$1(action) || typeof action === 'number') {
        var exec = getActionFunction(action, actionFunctionMap);

        if (isFunction$1(exec)) {
          actionObject = {
            type: action,
            exec: exec
          };
        } else if (exec) {
          actionObject = exec;
        } else {
          actionObject = {
            type: action,
            exec: undefined
          };
        }
      } else if (isFunction$1(action)) {
        actionObject = {
          // Convert action to string if unnamed
          type: action.name || action.toString(),
          exec: action
        };
      } else {
        var exec = getActionFunction(action.type, actionFunctionMap);

        if (isFunction$1(exec)) {
          actionObject = __assign$1(__assign$1({}, action), {
            exec: exec
          });
        } else if (exec) {
          var actionType = exec.type || action.type;
          actionObject = __assign$1(__assign$1(__assign$1({}, exec), action), {
            type: actionType
          });
        } else {
          actionObject = action;
        }
      }

      return actionObject;
    }
    var toActionObjects = function (action, actionFunctionMap) {
      if (!action) {
        return [];
      }

      var actions = isArray$1(action) ? action : [action];
      return actions.map(function (subAction) {
        return toActionObject(subAction, actionFunctionMap);
      });
    };
    function toActivityDefinition(action) {
      var actionObject = toActionObject(action);
      return __assign$1(__assign$1({
        id: isString$1(action) ? action : actionObject.id
      }, actionObject), {
        type: actionObject.type
      });
    }
    /**
     * Raises an event. This places the event in the internal event queue, so that
     * the event is immediately consumed by the machine in the current step.
     *
     * @param eventType The event to raise.
     */

    function raise$1(event) {
      if (!isString$1(event)) {
        return send$2(event, {
          to: SpecialTargets.Internal
        });
      }

      return {
        type: raise$2,
        event: event
      };
    }
    function resolveRaise(action) {
      return {
        type: raise$2,
        _event: toSCXMLEvent(action.event)
      };
    }
    /**
     * Sends an event. This returns an action that will be read by an interpreter to
     * send the event in the next step, after the current step is finished executing.
     *
     * @param event The event to send.
     * @param options Options to pass into the send event:
     *  - `id` - The unique send event identifier (used with `cancel()`).
     *  - `delay` - The number of milliseconds to delay the sending of the event.
     *  - `to` - The target of this event (by default, the machine the event was sent from).
     */

    function send$2(event, options) {
      return {
        to: options ? options.to : undefined,
        type: send$3,
        event: isFunction$1(event) ? event : toEventObject(event),
        delay: options ? options.delay : undefined,
        id: options && options.id !== undefined ? options.id : isFunction$1(event) ? event.name : getEventType(event)
      };
    }
    function resolveSend(action, ctx, _event, delaysMap) {
      var meta = {
        _event: _event
      }; // TODO: helper function for resolving Expr

      var resolvedEvent = toSCXMLEvent(isFunction$1(action.event) ? action.event(ctx, _event.data, meta) : action.event);
      var resolvedDelay;

      if (isString$1(action.delay)) {
        var configDelay = delaysMap && delaysMap[action.delay];
        resolvedDelay = isFunction$1(configDelay) ? configDelay(ctx, _event.data, meta) : configDelay;
      } else {
        resolvedDelay = isFunction$1(action.delay) ? action.delay(ctx, _event.data, meta) : action.delay;
      }

      var resolvedTarget = isFunction$1(action.to) ? action.to(ctx, _event.data, meta) : action.to;
      return __assign$1(__assign$1({}, action), {
        to: resolvedTarget,
        _event: resolvedEvent,
        event: resolvedEvent.data,
        delay: resolvedDelay
      });
    }
    /**
     * Sends an event to this machine's parent.
     *
     * @param event The event to send to the parent machine.
     * @param options Options to pass into the send event.
     */

    function sendParent$2(event, options) {
      return send$2(event, __assign$1(__assign$1({}, options), {
        to: SpecialTargets.Parent
      }));
    }
    var resolveLog = function (action, ctx, _event) {
      return __assign$1(__assign$1({}, action), {
        value: isString$1(action.expr) ? action.expr : action.expr(ctx, _event.data, {
          _event: _event
        })
      });
    };
    /**
     * Cancels an in-flight `send(...)` action. A canceled sent action will not
     * be executed, nor will its event be sent, unless it has already been sent
     * (e.g., if `cancel(...)` is called after the `send(...)` action's `delay`).
     *
     * @param sendId The `id` of the `send(...)` action to cancel.
     */

    var cancel$1 = function (sendId) {
      return {
        type: cancel$2,
        sendId: sendId
      };
    };
    /**
     * Starts an activity.
     *
     * @param activity The activity to start.
     */

    function start$1(activity) {
      var activityDef = toActivityDefinition(activity);
      return {
        type: ActionTypes.Start,
        activity: activityDef,
        exec: undefined
      };
    }
    /**
     * Stops an activity.
     *
     * @param actorRef The activity to stop.
     */

    function stop$1(actorRef) {
      var activity = isFunction$1(actorRef) ? actorRef : toActivityDefinition(actorRef);
      return {
        type: ActionTypes.Stop,
        activity: activity,
        exec: undefined
      };
    }
    function resolveStop(action, context, _event) {
      var actorRefOrString = isFunction$1(action.activity) ? action.activity(context, _event.data) : action.activity;
      var resolvedActorRef = typeof actorRefOrString === 'string' ? {
        id: actorRefOrString
      } : actorRefOrString;
      var actionObject = {
        type: ActionTypes.Stop,
        activity: resolvedActorRef
      };
      return actionObject;
    }
    /**
     * Updates the current context of the machine.
     *
     * @param assignment An object that represents the partial context to update.
     */

    var assign$2 = function (assignment) {
      return {
        type: assign$3,
        assignment: assignment
      };
    };
    /**
     * Returns an event type that represents an implicit event that
     * is sent after the specified `delay`.
     *
     * @param delayRef The delay in milliseconds
     * @param id The state node ID where this event is handled
     */

    function after$1(delayRef, id) {
      var idSuffix = id ? "#".concat(id) : '';
      return "".concat(ActionTypes.After, "(").concat(delayRef, ")").concat(idSuffix);
    }
    /**
     * Returns an event that represents that a final state node
     * has been reached in the parent state node.
     *
     * @param id The final state node's parent state node `id`
     * @param data The data to pass into the event
     */

    function done(id, data) {
      var type = "".concat(ActionTypes.DoneState, ".").concat(id);
      var eventObject = {
        type: type,
        data: data
      };

      eventObject.toString = function () {
        return type;
      };

      return eventObject;
    }
    /**
     * Returns an event that represents that an invoked service has terminated.
     *
     * An invoked service is terminated when it has reached a top-level final state node,
     * but not when it is canceled.
     *
     * @param id The final state node ID
     * @param data The data to pass into the event
     */

    function doneInvoke(id, data) {
      var type = "".concat(ActionTypes.DoneInvoke, ".").concat(id);
      var eventObject = {
        type: type,
        data: data
      };

      eventObject.toString = function () {
        return type;
      };

      return eventObject;
    }
    function error$1(id, data) {
      var type = "".concat(ActionTypes.ErrorPlatform, ".").concat(id);
      var eventObject = {
        type: type,
        data: data
      };

      eventObject.toString = function () {
        return type;
      };

      return eventObject;
    }
    function resolveActions(machine, currentState, currentContext, _event, actions, preserveActionOrder) {
      if (preserveActionOrder === void 0) {
        preserveActionOrder = false;
      }

      var _a = __read(preserveActionOrder ? [[], actions] : partition(actions, function (action) {
        return action.type === assign$3;
      }), 2),
          assignActions = _a[0],
          otherActions = _a[1];

      var updatedContext = assignActions.length ? updateContext(currentContext, _event, assignActions, currentState) : currentContext;
      var preservedContexts = preserveActionOrder ? [currentContext] : undefined;
      var resolvedActions = flatten(otherActions.map(function (actionObject) {
        var _a;

        switch (actionObject.type) {
          case raise$2:
            return resolveRaise(actionObject);

          case send$3:
            var sendAction = resolveSend(actionObject, updatedContext, _event, machine.options.delays); // TODO: fix ActionTypes.Init

            {
              // warn after resolving as we can create better contextual message here
              warn(!isString$1(actionObject.delay) || typeof sendAction.delay === 'number', // tslint:disable-next-line:max-line-length
              "No delay reference for delay expression '".concat(actionObject.delay, "' was found on machine '").concat(machine.id, "'"));
            }

            return sendAction;

          case log$1:
            return resolveLog(actionObject, updatedContext, _event);

          case choose$1:
            {
              var chooseAction = actionObject;
              var matchedActions = (_a = chooseAction.conds.find(function (condition) {
                var guard = toGuard(condition.cond, machine.options.guards);
                return !guard || evaluateGuard(machine, guard, updatedContext, _event, currentState);
              })) === null || _a === void 0 ? void 0 : _a.actions;

              if (!matchedActions) {
                return [];
              }

              var _b = __read(resolveActions(machine, currentState, updatedContext, _event, toActionObjects(toArray(matchedActions), machine.options.actions), preserveActionOrder), 2),
                  resolvedActionsFromChoose = _b[0],
                  resolvedContextFromChoose = _b[1];

              updatedContext = resolvedContextFromChoose;
              preservedContexts === null || preservedContexts === void 0 ? void 0 : preservedContexts.push(updatedContext);
              return resolvedActionsFromChoose;
            }

          case pure$1:
            {
              var matchedActions = actionObject.get(updatedContext, _event.data);

              if (!matchedActions) {
                return [];
              }

              var _c = __read(resolveActions(machine, currentState, updatedContext, _event, toActionObjects(toArray(matchedActions), machine.options.actions), preserveActionOrder), 2),
                  resolvedActionsFromPure = _c[0],
                  resolvedContext = _c[1];

              updatedContext = resolvedContext;
              preservedContexts === null || preservedContexts === void 0 ? void 0 : preservedContexts.push(updatedContext);
              return resolvedActionsFromPure;
            }

          case stop$2:
            {
              return resolveStop(actionObject, updatedContext, _event);
            }

          case assign$3:
            {
              updatedContext = updateContext(updatedContext, _event, [actionObject], currentState);
              preservedContexts === null || preservedContexts === void 0 ? void 0 : preservedContexts.push(updatedContext);
              break;
            }

          default:
            var resolvedActionObject = toActionObject(actionObject, machine.options.actions);
            var exec_1 = resolvedActionObject.exec;

            if (exec_1 && preservedContexts) {
              var contextIndex_1 = preservedContexts.length - 1;
              resolvedActionObject = __assign$1(__assign$1({}, resolvedActionObject), {
                exec: function (_ctx) {
                  var args = [];

                  for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                  }

                  exec_1.apply(void 0, __spreadArray([preservedContexts[contextIndex_1]], __read(args), false));
                }
              });
            }

            return resolvedActionObject;
        }
      }).filter(function (a) {
        return !!a;
      }));
      return [resolvedActions, updatedContext];
    }

    /**
     * Maintains a stack of the current service in scope.
     * This is used to provide the correct service to spawn().
     */
    var serviceStack = [];
    var provide = function (service, fn) {
      serviceStack.push(service);
      var result = fn(service);
      serviceStack.pop();
      return result;
    };
    var consume = function (fn) {
      return fn(serviceStack[serviceStack.length - 1]);
    };

    function createNullActor(id) {
      var _a;

      return _a = {
        id: id,
        send: function () {
          return void 0;
        },
        subscribe: function () {
          return {
            unsubscribe: function () {
              return void 0;
            }
          };
        },
        getSnapshot: function () {
          return undefined;
        },
        toJSON: function () {
          return {
            id: id
          };
        }
      }, _a[symbolObservable] = function () {
        return this;
      }, _a;
    }
    /**
     * Creates a deferred actor that is able to be invoked given the provided
     * invocation information in its `.meta` value.
     *
     * @param invokeDefinition The meta information needed to invoke the actor.
     */

    function createInvocableActor(invokeDefinition, machine, context, _event) {
      var _a;

      var invokeSrc = toInvokeSource$1(invokeDefinition.src);
      var serviceCreator = (_a = machine === null || machine === void 0 ? void 0 : machine.options.services) === null || _a === void 0 ? void 0 : _a[invokeSrc.type];
      var resolvedData = invokeDefinition.data ? mapContext(invokeDefinition.data, context, _event) : undefined;
      var tempActor = serviceCreator ? createDeferredActor(serviceCreator, invokeDefinition.id, resolvedData) : createNullActor(invokeDefinition.id); // @ts-ignore

      tempActor.meta = invokeDefinition;
      return tempActor;
    }
    function createDeferredActor(entity, id, data) {
      var tempActor = createNullActor(id); // @ts-ignore

      tempActor.deferred = true;

      if (isMachine(entity)) {
        // "mute" the existing service scope so potential spawned actors within the `.initialState` stay deferred here
        var initialState_1 = tempActor.state = provide(undefined, function () {
          return (data ? entity.withContext(data) : entity).initialState;
        });

        tempActor.getSnapshot = function () {
          return initialState_1;
        };
      }

      return tempActor;
    }
    function isActor(item) {
      try {
        return typeof item.send === 'function';
      } catch (e) {
        return false;
      }
    }
    function isSpawnedActor(item) {
      return isActor(item) && 'id' in item;
    } // TODO: refactor the return type, this could be written in a better way but it's best to avoid unneccessary breaking changes now

    function toActorRef(actorRefLike) {
      var _a;

      return __assign$1((_a = {
        subscribe: function () {
          return {
            unsubscribe: function () {
              return void 0;
            }
          };
        },
        id: 'anonymous',
        getSnapshot: function () {
          return undefined;
        }
      }, _a[symbolObservable] = function () {
        return this;
      }, _a), actorRefLike);
    }

    var isLeafNode = function (stateNode) {
      return stateNode.type === 'atomic' || stateNode.type === 'final';
    };
    function getChildren(stateNode) {
      return Object.keys(stateNode.states).map(function (key) {
        return stateNode.states[key];
      });
    }
    function getAllStateNodes(stateNode) {
      var stateNodes = [stateNode];

      if (isLeafNode(stateNode)) {
        return stateNodes;
      }

      return stateNodes.concat(flatten(getChildren(stateNode).map(getAllStateNodes)));
    }
    function getConfiguration(prevStateNodes, stateNodes) {
      var e_1, _a, e_2, _b, e_3, _c, e_4, _d;

      var prevConfiguration = new Set(prevStateNodes);
      var prevAdjList = getAdjList(prevConfiguration);
      var configuration = new Set(stateNodes);

      try {
        // add all ancestors
        for (var configuration_1 = __values$1(configuration), configuration_1_1 = configuration_1.next(); !configuration_1_1.done; configuration_1_1 = configuration_1.next()) {
          var s = configuration_1_1.value;
          var m = s.parent;

          while (m && !configuration.has(m)) {
            configuration.add(m);
            m = m.parent;
          }
        }
      } catch (e_1_1) {
        e_1 = {
          error: e_1_1
        };
      } finally {
        try {
          if (configuration_1_1 && !configuration_1_1.done && (_a = configuration_1.return)) _a.call(configuration_1);
        } finally {
          if (e_1) throw e_1.error;
        }
      }

      var adjList = getAdjList(configuration);

      try {
        // add descendants
        for (var configuration_2 = __values$1(configuration), configuration_2_1 = configuration_2.next(); !configuration_2_1.done; configuration_2_1 = configuration_2.next()) {
          var s = configuration_2_1.value; // if previously active, add existing child nodes

          if (s.type === 'compound' && (!adjList.get(s) || !adjList.get(s).length)) {
            if (prevAdjList.get(s)) {
              prevAdjList.get(s).forEach(function (sn) {
                return configuration.add(sn);
              });
            } else {
              s.initialStateNodes.forEach(function (sn) {
                return configuration.add(sn);
              });
            }
          } else {
            if (s.type === 'parallel') {
              try {
                for (var _e = (e_3 = void 0, __values$1(getChildren(s))), _f = _e.next(); !_f.done; _f = _e.next()) {
                  var child = _f.value;

                  if (child.type === 'history') {
                    continue;
                  }

                  if (!configuration.has(child)) {
                    configuration.add(child);

                    if (prevAdjList.get(child)) {
                      prevAdjList.get(child).forEach(function (sn) {
                        return configuration.add(sn);
                      });
                    } else {
                      child.initialStateNodes.forEach(function (sn) {
                        return configuration.add(sn);
                      });
                    }
                  }
                }
              } catch (e_3_1) {
                e_3 = {
                  error: e_3_1
                };
              } finally {
                try {
                  if (_f && !_f.done && (_c = _e.return)) _c.call(_e);
                } finally {
                  if (e_3) throw e_3.error;
                }
              }
            }
          }
        }
      } catch (e_2_1) {
        e_2 = {
          error: e_2_1
        };
      } finally {
        try {
          if (configuration_2_1 && !configuration_2_1.done && (_b = configuration_2.return)) _b.call(configuration_2);
        } finally {
          if (e_2) throw e_2.error;
        }
      }

      try {
        // add all ancestors
        for (var configuration_3 = __values$1(configuration), configuration_3_1 = configuration_3.next(); !configuration_3_1.done; configuration_3_1 = configuration_3.next()) {
          var s = configuration_3_1.value;
          var m = s.parent;

          while (m && !configuration.has(m)) {
            configuration.add(m);
            m = m.parent;
          }
        }
      } catch (e_4_1) {
        e_4 = {
          error: e_4_1
        };
      } finally {
        try {
          if (configuration_3_1 && !configuration_3_1.done && (_d = configuration_3.return)) _d.call(configuration_3);
        } finally {
          if (e_4) throw e_4.error;
        }
      }

      return configuration;
    }

    function getValueFromAdj(baseNode, adjList) {
      var childStateNodes = adjList.get(baseNode);

      if (!childStateNodes) {
        return {}; // todo: fix?
      }

      if (baseNode.type === 'compound') {
        var childStateNode = childStateNodes[0];

        if (childStateNode) {
          if (isLeafNode(childStateNode)) {
            return childStateNode.key;
          }
        } else {
          return {};
        }
      }

      var stateValue = {};
      childStateNodes.forEach(function (csn) {
        stateValue[csn.key] = getValueFromAdj(csn, adjList);
      });
      return stateValue;
    }

    function getAdjList(configuration) {
      var e_5, _a;

      var adjList = new Map();

      try {
        for (var configuration_4 = __values$1(configuration), configuration_4_1 = configuration_4.next(); !configuration_4_1.done; configuration_4_1 = configuration_4.next()) {
          var s = configuration_4_1.value;

          if (!adjList.has(s)) {
            adjList.set(s, []);
          }

          if (s.parent) {
            if (!adjList.has(s.parent)) {
              adjList.set(s.parent, []);
            }

            adjList.get(s.parent).push(s);
          }
        }
      } catch (e_5_1) {
        e_5 = {
          error: e_5_1
        };
      } finally {
        try {
          if (configuration_4_1 && !configuration_4_1.done && (_a = configuration_4.return)) _a.call(configuration_4);
        } finally {
          if (e_5) throw e_5.error;
        }
      }

      return adjList;
    }
    function getValue(rootNode, configuration) {
      var config = getConfiguration([rootNode], configuration);
      return getValueFromAdj(rootNode, getAdjList(config));
    }
    function has(iterable, item) {
      if (Array.isArray(iterable)) {
        return iterable.some(function (member) {
          return member === item;
        });
      }

      if (iterable instanceof Set) {
        return iterable.has(item);
      }

      return false; // TODO: fix
    }
    function nextEvents(configuration) {
      return __spreadArray([], __read(new Set(flatten(__spreadArray([], __read(configuration.map(function (sn) {
        return sn.ownEvents;
      })), false)))), false);
    }
    function isInFinalState(configuration, stateNode) {
      if (stateNode.type === 'compound') {
        return getChildren(stateNode).some(function (s) {
          return s.type === 'final' && has(configuration, s);
        });
      }

      if (stateNode.type === 'parallel') {
        return getChildren(stateNode).every(function (sn) {
          return isInFinalState(configuration, sn);
        });
      }

      return false;
    }
    function getMeta(configuration) {
      if (configuration === void 0) {
        configuration = [];
      }

      return configuration.reduce(function (acc, stateNode) {
        if (stateNode.meta !== undefined) {
          acc[stateNode.id] = stateNode.meta;
        }

        return acc;
      }, {});
    }
    function getTagsFromConfiguration(configuration) {
      return new Set(flatten(configuration.map(function (sn) {
        return sn.tags;
      })));
    }

    function stateValuesEqual(a, b) {
      if (a === b) {
        return true;
      }

      if (a === undefined || b === undefined) {
        return false;
      }

      if (isString$1(a) || isString$1(b)) {
        return a === b;
      }

      var aKeys = Object.keys(a);
      var bKeys = Object.keys(b);
      return aKeys.length === bKeys.length && aKeys.every(function (key) {
        return stateValuesEqual(a[key], b[key]);
      });
    }
    function isStateConfig(state) {
      if (typeof state !== 'object' || state === null) {
        return false;
      }

      return 'value' in state && '_event' in state;
    }
    function bindActionToState(action, state) {
      var exec = action.exec;

      var boundAction = __assign$1(__assign$1({}, action), {
        exec: exec !== undefined ? function () {
          return exec(state.context, state.event, {
            action: action,
            state: state,
            _event: state._event
          });
        } : undefined
      });

      return boundAction;
    }

    var State =
    /*#__PURE__*/

    /** @class */
    function () {
      /**
       * Creates a new State instance.
       * @param value The state value
       * @param context The extended state
       * @param historyValue The tree representing historical values of the state nodes
       * @param history The previous state
       * @param actions An array of action objects to execute as side-effects
       * @param activities A mapping of activities and whether they are started (`true`) or stopped (`false`).
       * @param meta
       * @param events Internal event queue. Should be empty with run-to-completion semantics.
       * @param configuration
       */
      function State(config) {
        var _this = this;

        var _a;

        this.actions = [];
        this.activities = EMPTY_ACTIVITY_MAP$1;
        this.meta = {};
        this.events = [];
        this.value = config.value;
        this.context = config.context;
        this._event = config._event;
        this._sessionid = config._sessionid;
        this.event = this._event.data;
        this.historyValue = config.historyValue;
        this.history = config.history;
        this.actions = config.actions || [];
        this.activities = config.activities || EMPTY_ACTIVITY_MAP$1;
        this.meta = getMeta(config.configuration);
        this.events = config.events || [];
        this.matches = this.matches.bind(this);
        this.toStrings = this.toStrings.bind(this);
        this.configuration = config.configuration;
        this.transitions = config.transitions;
        this.children = config.children;
        this.done = !!config.done;
        this.tags = (_a = Array.isArray(config.tags) ? new Set(config.tags) : config.tags) !== null && _a !== void 0 ? _a : new Set();
        this.machine = config.machine;
        Object.defineProperty(this, 'nextEvents', {
          get: function () {
            return nextEvents(_this.configuration);
          }
        });
      }
      /**
       * Creates a new State instance for the given `stateValue` and `context`.
       * @param stateValue
       * @param context
       */


      State.from = function (stateValue, context) {
        if (stateValue instanceof State) {
          if (stateValue.context !== context) {
            return new State({
              value: stateValue.value,
              context: context,
              _event: stateValue._event,
              _sessionid: null,
              historyValue: stateValue.historyValue,
              history: stateValue.history,
              actions: [],
              activities: stateValue.activities,
              meta: {},
              events: [],
              configuration: [],
              transitions: [],
              children: {}
            });
          }

          return stateValue;
        }

        var _event = initEvent;
        return new State({
          value: stateValue,
          context: context,
          _event: _event,
          _sessionid: null,
          historyValue: undefined,
          history: undefined,
          actions: [],
          activities: undefined,
          meta: undefined,
          events: [],
          configuration: [],
          transitions: [],
          children: {}
        });
      };
      /**
       * Creates a new State instance for the given `config`.
       * @param config The state config
       */


      State.create = function (config) {
        return new State(config);
      };
      /**
       * Creates a new `State` instance for the given `stateValue` and `context` with no actions (side-effects).
       * @param stateValue
       * @param context
       */


      State.inert = function (stateValue, context) {
        if (stateValue instanceof State) {
          if (!stateValue.actions.length) {
            return stateValue;
          }

          var _event = initEvent;
          return new State({
            value: stateValue.value,
            context: context,
            _event: _event,
            _sessionid: null,
            historyValue: stateValue.historyValue,
            history: stateValue.history,
            activities: stateValue.activities,
            configuration: stateValue.configuration,
            transitions: [],
            children: {}
          });
        }

        return State.from(stateValue, context);
      };
      /**
       * Returns an array of all the string leaf state node paths.
       * @param stateValue
       * @param delimiter The character(s) that separate each subpath in the string state node path.
       */


      State.prototype.toStrings = function (stateValue, delimiter) {
        var _this = this;

        if (stateValue === void 0) {
          stateValue = this.value;
        }

        if (delimiter === void 0) {
          delimiter = '.';
        }

        if (isString$1(stateValue)) {
          return [stateValue];
        }

        var valueKeys = Object.keys(stateValue);
        return valueKeys.concat.apply(valueKeys, __spreadArray([], __read(valueKeys.map(function (key) {
          return _this.toStrings(stateValue[key], delimiter).map(function (s) {
            return key + delimiter + s;
          });
        })), false));
      };

      State.prototype.toJSON = function () {
        var _a = this;
            _a.configuration;
            _a.transitions;
            var tags = _a.tags;
            _a.machine;
            var jsonValues = __rest(_a, ["configuration", "transitions", "tags", "machine"]);

        return __assign$1(__assign$1({}, jsonValues), {
          tags: Array.from(tags)
        });
      };

      State.prototype.matches = function (parentStateValue) {
        return matchesState(parentStateValue, this.value);
      };
      /**
       * Whether the current state configuration has a state node with the specified `tag`.
       * @param tag
       */


      State.prototype.hasTag = function (tag) {
        return this.tags.has(tag);
      };
      /**
       * Determines whether sending the `event` will cause a non-forbidden transition
       * to be selected, even if the transitions have no actions nor
       * change the state value.
       *
       * @param event The event to test
       * @returns Whether the event will cause a transition
       */


      State.prototype.can = function (event) {
        var _a;

        var transitionData = (_a = this.machine) === null || _a === void 0 ? void 0 : _a.getTransitionData(this, event);
        return !!(transitionData === null || transitionData === void 0 ? void 0 : transitionData.transitions.length) && // Check that at least one transition is not forbidden
        transitionData.transitions.some(function (t) {
          return t.target !== undefined || t.actions.length;
        });
      };

      return State;
    }();

    var defaultOptions$1 = {
      deferEvents: false
    };

    var Scheduler =
    /*#__PURE__*/

    /** @class */
    function () {
      function Scheduler(options) {
        this.processingEvent = false;
        this.queue = [];
        this.initialized = false;
        this.options = __assign$1(__assign$1({}, defaultOptions$1), options);
      }

      Scheduler.prototype.initialize = function (callback) {
        this.initialized = true;

        if (callback) {
          if (!this.options.deferEvents) {
            this.schedule(callback);
            return;
          }

          this.process(callback);
        }

        this.flushEvents();
      };

      Scheduler.prototype.schedule = function (task) {
        if (!this.initialized || this.processingEvent) {
          this.queue.push(task);
          return;
        }

        if (this.queue.length !== 0) {
          throw new Error('Event queue should be empty when it is not processing events');
        }

        this.process(task);
        this.flushEvents();
      };

      Scheduler.prototype.clear = function () {
        this.queue = [];
      };

      Scheduler.prototype.flushEvents = function () {
        var nextCallback = this.queue.shift();

        while (nextCallback) {
          this.process(nextCallback);
          nextCallback = this.queue.shift();
        }
      };

      Scheduler.prototype.process = function (callback) {
        this.processingEvent = true;

        try {
          callback();
        } catch (e) {
          // there is no use to keep the future events
          // as the situation is not anymore the same
          this.clear();
          throw e;
        } finally {
          this.processingEvent = false;
        }
      };

      return Scheduler;
    }();

    var children = /*#__PURE__*/new Map();
    var sessionIdIndex = 0;
    var registry = {
      bookId: function () {
        return "x:".concat(sessionIdIndex++);
      },
      register: function (id, actor) {
        children.set(id, actor);
        return id;
      },
      get: function (id) {
        return children.get(id);
      },
      free: function (id) {
        children.delete(id);
      }
    };

    function getGlobal() {
      if (typeof globalThis !== 'undefined') {
        return globalThis;
      }

      if (typeof self !== 'undefined') {
        return self;
      }

      if (typeof window !== 'undefined') {
        return window;
      }

      if (typeof global !== 'undefined') {
        return global;
      }

      {
        console.warn('XState could not find a global object in this environment. Please let the maintainers know and raise an issue here: https://github.com/statelyai/xstate/issues');
      }
    }

    function getDevTools() {
      var global = getGlobal();

      if (global && '__xstate__' in global) {
        return global.__xstate__;
      }

      return undefined;
    }

    function registerService(service) {
      if (!getGlobal()) {
        return;
      }

      var devTools = getDevTools();

      if (devTools) {
        devTools.register(service);
      }
    }

    function spawnBehavior(behavior, options) {
      if (options === void 0) {
        options = {};
      }

      var state = behavior.initialState;
      var observers = new Set();
      var mailbox = [];
      var flushing = false;

      var flush = function () {
        if (flushing) {
          return;
        }

        flushing = true;

        while (mailbox.length > 0) {
          var event_1 = mailbox.shift();
          state = behavior.transition(state, event_1, actorCtx);
          observers.forEach(function (observer) {
            return observer.next(state);
          });
        }

        flushing = false;
      };

      var actor = toActorRef({
        id: options.id,
        send: function (event) {
          mailbox.push(event);
          flush();
        },
        getSnapshot: function () {
          return state;
        },
        subscribe: function (next, handleError, complete) {
          var observer = toObserver(next, handleError, complete);
          observers.add(observer);
          observer.next(state);
          return {
            unsubscribe: function () {
              observers.delete(observer);
            }
          };
        }
      });
      var actorCtx = {
        parent: options.parent,
        self: actor,
        id: options.id || 'anonymous',
        observers: observers
      };
      state = behavior.start ? behavior.start(actorCtx) : state;
      return actor;
    }

    var DEFAULT_SPAWN_OPTIONS = {
      sync: false,
      autoForward: false
    };
    var InterpreterStatus;

    (function (InterpreterStatus) {
      InterpreterStatus[InterpreterStatus["NotStarted"] = 0] = "NotStarted";
      InterpreterStatus[InterpreterStatus["Running"] = 1] = "Running";
      InterpreterStatus[InterpreterStatus["Stopped"] = 2] = "Stopped";
    })(InterpreterStatus || (InterpreterStatus = {}));

    var Interpreter =
    /*#__PURE__*/

    /** @class */
    function () {
      /**
       * Creates a new Interpreter instance (i.e., service) for the given machine with the provided options, if any.
       *
       * @param machine The machine to be interpreted
       * @param options Interpreter options
       */
      function Interpreter(machine, options) {
        var _this = this;

        if (options === void 0) {
          options = Interpreter.defaultOptions;
        }

        this.machine = machine;
        this.scheduler = new Scheduler();
        this.delayedEventsMap = {};
        this.listeners = new Set();
        this.contextListeners = new Set();
        this.stopListeners = new Set();
        this.doneListeners = new Set();
        this.eventListeners = new Set();
        this.sendListeners = new Set();
        /**
         * Whether the service is started.
         */

        this.initialized = false;
        this.status = InterpreterStatus.NotStarted;
        this.children = new Map();
        this.forwardTo = new Set();
        /**
         * Alias for Interpreter.prototype.start
         */

        this.init = this.start;
        /**
         * Sends an event to the running interpreter to trigger a transition.
         *
         * An array of events (batched) can be sent as well, which will send all
         * batched events to the running interpreter. The listeners will be
         * notified only **once** when all events are processed.
         *
         * @param event The event(s) to send
         */

        this.send = function (event, payload) {
          if (isArray$1(event)) {
            _this.batch(event);

            return _this.state;
          }

          var _event = toSCXMLEvent(toEventObject(event, payload));

          if (_this.status === InterpreterStatus.Stopped) {
            // do nothing
            {
              warn(false, "Event \"".concat(_event.name, "\" was sent to stopped service \"").concat(_this.machine.id, "\". This service has already reached its final state, and will not transition.\nEvent: ").concat(JSON.stringify(_event.data)));
            }

            return _this.state;
          }

          if (_this.status !== InterpreterStatus.Running && !_this.options.deferEvents) {
            throw new Error("Event \"".concat(_event.name, "\" was sent to uninitialized service \"").concat(_this.machine.id // tslint:disable-next-line:max-line-length
            , "\". Make sure .start() is called for this service, or set { deferEvents: true } in the service options.\nEvent: ").concat(JSON.stringify(_event.data)));
          }

          _this.scheduler.schedule(function () {
            // Forward copy of event to child actors
            _this.forward(_event);

            var nextState = _this.nextState(_event);

            _this.update(nextState, _event);
          });

          return _this._state; // TODO: deprecate (should return void)
          // tslint:disable-next-line:semicolon
        };

        this.sendTo = function (event, to) {
          var isParent = _this.parent && (to === SpecialTargets.Parent || _this.parent.id === to);
          var target = isParent ? _this.parent : isString$1(to) ? _this.children.get(to) || registry.get(to) : isActor$1(to) ? to : undefined;

          if (!target) {
            if (!isParent) {
              throw new Error("Unable to send event to child '".concat(to, "' from service '").concat(_this.id, "'."));
            } // tslint:disable-next-line:no-console


            {
              warn(false, "Service '".concat(_this.id, "' has no parent: unable to send event ").concat(event.type));
            }

            return;
          }

          if ('machine' in target) {
            // Send SCXML events to machines
            target.send(__assign$1(__assign$1({}, event), {
              name: event.name === error$2 ? "".concat(error$1(_this.id)) : event.name,
              origin: _this.sessionId
            }));
          } else {
            // Send normal events to other targets
            target.send(event.data);
          }
        };

        var resolvedOptions = __assign$1(__assign$1({}, Interpreter.defaultOptions), options);

        var clock = resolvedOptions.clock,
            logger = resolvedOptions.logger,
            parent = resolvedOptions.parent,
            id = resolvedOptions.id;
        var resolvedId = id !== undefined ? id : machine.id;
        this.id = resolvedId;
        this.logger = logger;
        this.clock = clock;
        this.parent = parent;
        this.options = resolvedOptions;
        this.scheduler = new Scheduler({
          deferEvents: this.options.deferEvents
        });
        this.sessionId = registry.bookId();
      }

      Object.defineProperty(Interpreter.prototype, "initialState", {
        get: function () {
          var _this = this;

          if (this._initialState) {
            return this._initialState;
          }

          return provide(this, function () {
            _this._initialState = _this.machine.initialState;
            return _this._initialState;
          });
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(Interpreter.prototype, "state", {
        get: function () {
          {
            warn(this.status !== InterpreterStatus.NotStarted, "Attempted to read state from uninitialized service '".concat(this.id, "'. Make sure the service is started first."));
          }

          return this._state;
        },
        enumerable: false,
        configurable: true
      });
      /**
       * Executes the actions of the given state, with that state's `context` and `event`.
       *
       * @param state The state whose actions will be executed
       * @param actionsConfig The action implementations to use
       */

      Interpreter.prototype.execute = function (state, actionsConfig) {
        var e_1, _a;

        try {
          for (var _b = __values$1(state.actions), _c = _b.next(); !_c.done; _c = _b.next()) {
            var action = _c.value;
            this.exec(action, state, actionsConfig);
          }
        } catch (e_1_1) {
          e_1 = {
            error: e_1_1
          };
        } finally {
          try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
          } finally {
            if (e_1) throw e_1.error;
          }
        }
      };

      Interpreter.prototype.update = function (state, _event) {
        var e_2, _a, e_3, _b, e_4, _c, e_5, _d;

        var _this = this; // Attach session ID to state


        state._sessionid = this.sessionId; // Update state

        this._state = state; // Execute actions

        if (this.options.execute) {
          this.execute(this.state);
        } // Update children


        this.children.forEach(function (child) {
          _this.state.children[child.id] = child;
        }); // Dev tools

        if (this.devTools) {
          this.devTools.send(_event.data, state);
        } // Execute listeners


        if (state.event) {
          try {
            for (var _e = __values$1(this.eventListeners), _f = _e.next(); !_f.done; _f = _e.next()) {
              var listener = _f.value;
              listener(state.event);
            }
          } catch (e_2_1) {
            e_2 = {
              error: e_2_1
            };
          } finally {
            try {
              if (_f && !_f.done && (_a = _e.return)) _a.call(_e);
            } finally {
              if (e_2) throw e_2.error;
            }
          }
        }

        try {
          for (var _g = __values$1(this.listeners), _h = _g.next(); !_h.done; _h = _g.next()) {
            var listener = _h.value;
            listener(state, state.event);
          }
        } catch (e_3_1) {
          e_3 = {
            error: e_3_1
          };
        } finally {
          try {
            if (_h && !_h.done && (_b = _g.return)) _b.call(_g);
          } finally {
            if (e_3) throw e_3.error;
          }
        }

        try {
          for (var _j = __values$1(this.contextListeners), _k = _j.next(); !_k.done; _k = _j.next()) {
            var contextListener = _k.value;
            contextListener(this.state.context, this.state.history ? this.state.history.context : undefined);
          }
        } catch (e_4_1) {
          e_4 = {
            error: e_4_1
          };
        } finally {
          try {
            if (_k && !_k.done && (_c = _j.return)) _c.call(_j);
          } finally {
            if (e_4) throw e_4.error;
          }
        }

        var isDone = isInFinalState(state.configuration || [], this.machine);

        if (this.state.configuration && isDone) {
          // get final child state node
          var finalChildStateNode = state.configuration.find(function (sn) {
            return sn.type === 'final' && sn.parent === _this.machine;
          });
          var doneData = finalChildStateNode && finalChildStateNode.doneData ? mapContext(finalChildStateNode.doneData, state.context, _event) : undefined;

          try {
            for (var _l = __values$1(this.doneListeners), _m = _l.next(); !_m.done; _m = _l.next()) {
              var listener = _m.value;
              listener(doneInvoke(this.id, doneData));
            }
          } catch (e_5_1) {
            e_5 = {
              error: e_5_1
            };
          } finally {
            try {
              if (_m && !_m.done && (_d = _l.return)) _d.call(_l);
            } finally {
              if (e_5) throw e_5.error;
            }
          }

          this.stop();
        }
      };
      /*
       * Adds a listener that is notified whenever a state transition happens. The listener is called with
       * the next state and the event object that caused the state transition.
       *
       * @param listener The state listener
       */


      Interpreter.prototype.onTransition = function (listener) {
        this.listeners.add(listener); // Send current state to listener

        if (this.status === InterpreterStatus.Running) {
          listener(this.state, this.state.event);
        }

        return this;
      };

      Interpreter.prototype.subscribe = function (nextListenerOrObserver, _, // TODO: error listener
      completeListener) {
        var _this = this;

        if (!nextListenerOrObserver) {
          return {
            unsubscribe: function () {
              return void 0;
            }
          };
        }

        var listener;
        var resolvedCompleteListener = completeListener;

        if (typeof nextListenerOrObserver === 'function') {
          listener = nextListenerOrObserver;
        } else {
          listener = nextListenerOrObserver.next.bind(nextListenerOrObserver);
          resolvedCompleteListener = nextListenerOrObserver.complete.bind(nextListenerOrObserver);
        }

        this.listeners.add(listener); // Send current state to listener

        if (this.status === InterpreterStatus.Running) {
          listener(this.state);
        }

        if (resolvedCompleteListener) {
          this.onDone(resolvedCompleteListener);
        }

        return {
          unsubscribe: function () {
            listener && _this.listeners.delete(listener);
            resolvedCompleteListener && _this.doneListeners.delete(resolvedCompleteListener);
          }
        };
      };
      /**
       * Adds an event listener that is notified whenever an event is sent to the running interpreter.
       * @param listener The event listener
       */


      Interpreter.prototype.onEvent = function (listener) {
        this.eventListeners.add(listener);
        return this;
      };
      /**
       * Adds an event listener that is notified whenever a `send` event occurs.
       * @param listener The event listener
       */


      Interpreter.prototype.onSend = function (listener) {
        this.sendListeners.add(listener);
        return this;
      };
      /**
       * Adds a context listener that is notified whenever the state context changes.
       * @param listener The context listener
       */


      Interpreter.prototype.onChange = function (listener) {
        this.contextListeners.add(listener);
        return this;
      };
      /**
       * Adds a listener that is notified when the machine is stopped.
       * @param listener The listener
       */


      Interpreter.prototype.onStop = function (listener) {
        this.stopListeners.add(listener);
        return this;
      };
      /**
       * Adds a state listener that is notified when the statechart has reached its final state.
       * @param listener The state listener
       */


      Interpreter.prototype.onDone = function (listener) {
        this.doneListeners.add(listener);
        return this;
      };
      /**
       * Removes a listener.
       * @param listener The listener to remove
       */


      Interpreter.prototype.off = function (listener) {
        this.listeners.delete(listener);
        this.eventListeners.delete(listener);
        this.sendListeners.delete(listener);
        this.stopListeners.delete(listener);
        this.doneListeners.delete(listener);
        this.contextListeners.delete(listener);
        return this;
      };
      /**
       * Starts the interpreter from the given state, or the initial state.
       * @param initialState The state to start the statechart from
       */


      Interpreter.prototype.start = function (initialState) {
        var _this = this;

        if (this.status === InterpreterStatus.Running) {
          // Do not restart the service if it is already started
          return this;
        } // yes, it's a hack but we need the related cache to be populated for some things to work (like delayed transitions)
        // this is usually called by `machine.getInitialState` but if we rehydrate from a state we might bypass this call
        // we also don't want to call this method here as it resolves the full initial state which might involve calling assign actions
        // and that could potentially lead to some unwanted side-effects (even such as creating some rogue actors)


        this.machine._init();

        registry.register(this.sessionId, this);
        this.initialized = true;
        this.status = InterpreterStatus.Running;
        var resolvedState = initialState === undefined ? this.initialState : provide(this, function () {
          return isStateConfig(initialState) ? _this.machine.resolveState(initialState) : _this.machine.resolveState(State.from(initialState, _this.machine.context));
        });

        if (this.options.devTools) {
          this.attachDev();
        }

        this.scheduler.initialize(function () {
          _this.update(resolvedState, initEvent);
        });
        return this;
      };
      /**
       * Stops the interpreter and unsubscribe all listeners.
       *
       * This will also notify the `onStop` listeners.
       */


      Interpreter.prototype.stop = function () {
        var e_6, _a, e_7, _b, e_8, _c, e_9, _d, e_10, _e;

        var _this = this;

        try {
          for (var _f = __values$1(this.listeners), _g = _f.next(); !_g.done; _g = _f.next()) {
            var listener = _g.value;
            this.listeners.delete(listener);
          }
        } catch (e_6_1) {
          e_6 = {
            error: e_6_1
          };
        } finally {
          try {
            if (_g && !_g.done && (_a = _f.return)) _a.call(_f);
          } finally {
            if (e_6) throw e_6.error;
          }
        }

        try {
          for (var _h = __values$1(this.stopListeners), _j = _h.next(); !_j.done; _j = _h.next()) {
            var listener = _j.value; // call listener, then remove

            listener();
            this.stopListeners.delete(listener);
          }
        } catch (e_7_1) {
          e_7 = {
            error: e_7_1
          };
        } finally {
          try {
            if (_j && !_j.done && (_b = _h.return)) _b.call(_h);
          } finally {
            if (e_7) throw e_7.error;
          }
        }

        try {
          for (var _k = __values$1(this.contextListeners), _l = _k.next(); !_l.done; _l = _k.next()) {
            var listener = _l.value;
            this.contextListeners.delete(listener);
          }
        } catch (e_8_1) {
          e_8 = {
            error: e_8_1
          };
        } finally {
          try {
            if (_l && !_l.done && (_c = _k.return)) _c.call(_k);
          } finally {
            if (e_8) throw e_8.error;
          }
        }

        try {
          for (var _m = __values$1(this.doneListeners), _o = _m.next(); !_o.done; _o = _m.next()) {
            var listener = _o.value;
            this.doneListeners.delete(listener);
          }
        } catch (e_9_1) {
          e_9 = {
            error: e_9_1
          };
        } finally {
          try {
            if (_o && !_o.done && (_d = _m.return)) _d.call(_m);
          } finally {
            if (e_9) throw e_9.error;
          }
        }

        if (!this.initialized) {
          // Interpreter already stopped; do nothing
          return this;
        }

        __spreadArray([], __read(this.state.configuration), false).sort(function (a, b) {
          return b.order - a.order;
        }).forEach(function (stateNode) {
          var e_11, _a;

          try {
            for (var _b = __values$1(stateNode.definition.exit), _c = _b.next(); !_c.done; _c = _b.next()) {
              var action = _c.value;

              _this.exec(action, _this.state);
            }
          } catch (e_11_1) {
            e_11 = {
              error: e_11_1
            };
          } finally {
            try {
              if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            } finally {
              if (e_11) throw e_11.error;
            }
          }
        }); // Stop all children


        this.children.forEach(function (child) {
          if (isFunction$1(child.stop)) {
            child.stop();
          }
        });

        try {
          // Cancel all delayed events
          for (var _p = __values$1(Object.keys(this.delayedEventsMap)), _q = _p.next(); !_q.done; _q = _p.next()) {
            var key = _q.value;
            this.clock.clearTimeout(this.delayedEventsMap[key]);
          }
        } catch (e_10_1) {
          e_10 = {
            error: e_10_1
          };
        } finally {
          try {
            if (_q && !_q.done && (_e = _p.return)) _e.call(_p);
          } finally {
            if (e_10) throw e_10.error;
          }
        }

        this.scheduler.clear();
        this.initialized = false;
        this.status = InterpreterStatus.Stopped;
        registry.free(this.sessionId);
        return this;
      };

      Interpreter.prototype.batch = function (events) {
        var _this = this;

        if (this.status === InterpreterStatus.NotStarted && this.options.deferEvents) {
          // tslint:disable-next-line:no-console
          {
            warn(false, "".concat(events.length, " event(s) were sent to uninitialized service \"").concat(this.machine.id, "\" and are deferred. Make sure .start() is called for this service.\nEvent: ").concat(JSON.stringify(event)));
          }
        } else if (this.status !== InterpreterStatus.Running) {
          throw new Error( // tslint:disable-next-line:max-line-length
          "".concat(events.length, " event(s) were sent to uninitialized service \"").concat(this.machine.id, "\". Make sure .start() is called for this service, or set { deferEvents: true } in the service options."));
        }

        this.scheduler.schedule(function () {
          var e_12, _a;

          var nextState = _this.state;
          var batchChanged = false;
          var batchedActions = [];

          var _loop_1 = function (event_1) {
            var _event = toSCXMLEvent(event_1);

            _this.forward(_event);

            nextState = provide(_this, function () {
              return _this.machine.transition(nextState, _event);
            });
            batchedActions.push.apply(batchedActions, __spreadArray([], __read(nextState.actions.map(function (a) {
              return bindActionToState(a, nextState);
            })), false));
            batchChanged = batchChanged || !!nextState.changed;
          };

          try {
            for (var events_1 = __values$1(events), events_1_1 = events_1.next(); !events_1_1.done; events_1_1 = events_1.next()) {
              var event_1 = events_1_1.value;

              _loop_1(event_1);
            }
          } catch (e_12_1) {
            e_12 = {
              error: e_12_1
            };
          } finally {
            try {
              if (events_1_1 && !events_1_1.done && (_a = events_1.return)) _a.call(events_1);
            } finally {
              if (e_12) throw e_12.error;
            }
          }

          nextState.changed = batchChanged;
          nextState.actions = batchedActions;

          _this.update(nextState, toSCXMLEvent(events[events.length - 1]));
        });
      };
      /**
       * Returns a send function bound to this interpreter instance.
       *
       * @param event The event to be sent by the sender.
       */


      Interpreter.prototype.sender = function (event) {
        return this.send.bind(this, event);
      };
      /**
       * Returns the next state given the interpreter's current state and the event.
       *
       * This is a pure method that does _not_ update the interpreter's state.
       *
       * @param event The event to determine the next state
       */


      Interpreter.prototype.nextState = function (event) {
        var _this = this;

        var _event = toSCXMLEvent(event);

        if (_event.name.indexOf(errorPlatform$1) === 0 && !this.state.nextEvents.some(function (nextEvent) {
          return nextEvent.indexOf(errorPlatform$1) === 0;
        })) {
          throw _event.data.data;
        }

        var nextState = provide(this, function () {
          return _this.machine.transition(_this.state, _event);
        });
        return nextState;
      };

      Interpreter.prototype.forward = function (event) {
        var e_13, _a;

        try {
          for (var _b = __values$1(this.forwardTo), _c = _b.next(); !_c.done; _c = _b.next()) {
            var id = _c.value;
            var child = this.children.get(id);

            if (!child) {
              throw new Error("Unable to forward event '".concat(event, "' from interpreter '").concat(this.id, "' to nonexistant child '").concat(id, "'."));
            }

            child.send(event);
          }
        } catch (e_13_1) {
          e_13 = {
            error: e_13_1
          };
        } finally {
          try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
          } finally {
            if (e_13) throw e_13.error;
          }
        }
      };

      Interpreter.prototype.defer = function (sendAction) {
        var _this = this;

        this.delayedEventsMap[sendAction.id] = this.clock.setTimeout(function () {
          if (sendAction.to) {
            _this.sendTo(sendAction._event, sendAction.to);
          } else {
            _this.send(sendAction._event);
          }
        }, sendAction.delay);
      };

      Interpreter.prototype.cancel = function (sendId) {
        this.clock.clearTimeout(this.delayedEventsMap[sendId]);
        delete this.delayedEventsMap[sendId];
      };

      Interpreter.prototype.exec = function (action, state, actionFunctionMap) {
        if (actionFunctionMap === void 0) {
          actionFunctionMap = this.machine.options.actions;
        }

        var context = state.context,
            _event = state._event;
        var actionOrExec = action.exec || getActionFunction(action.type, actionFunctionMap);
        var exec = isFunction$1(actionOrExec) ? actionOrExec : actionOrExec ? actionOrExec.exec : action.exec;

        if (exec) {
          try {
            return exec(context, _event.data, {
              action: action,
              state: this.state,
              _event: _event
            });
          } catch (err) {
            if (this.parent) {
              this.parent.send({
                type: 'xstate.error',
                data: err
              });
            }

            throw err;
          }
        }

        switch (action.type) {
          case send$3:
            var sendAction = action;

            if (typeof sendAction.delay === 'number') {
              this.defer(sendAction);
              return;
            } else {
              if (sendAction.to) {
                this.sendTo(sendAction._event, sendAction.to);
              } else {
                this.send(sendAction._event);
              }
            }

            break;

          case cancel$2:
            this.cancel(action.sendId);
            break;

          case start$2:
            {
              if (this.status !== InterpreterStatus.Running) {
                return;
              }

              var activity = action.activity; // If the activity will be stopped right after it's started
              // (such as in transient states)
              // don't bother starting the activity.

              if (!this.state.activities[activity.id || activity.type]) {
                break;
              } // Invoked services


              if (activity.type === ActionTypes.Invoke) {
                var invokeSource = toInvokeSource$1(activity.src);
                var serviceCreator = this.machine.options.services ? this.machine.options.services[invokeSource.type] : undefined;
                var id = activity.id,
                    data = activity.data;

                {
                  warn(!('forward' in activity), // tslint:disable-next-line:max-line-length
                  "`forward` property is deprecated (found in invocation of '".concat(activity.src, "' in in machine '").concat(this.machine.id, "'). ") + "Please use `autoForward` instead.");
                }

                var autoForward = 'autoForward' in activity ? activity.autoForward : !!activity.forward;

                if (!serviceCreator) {
                  // tslint:disable-next-line:no-console
                  {
                    warn(false, "No service found for invocation '".concat(activity.src, "' in machine '").concat(this.machine.id, "'."));
                  }

                  return;
                }

                var resolvedData = data ? mapContext(data, context, _event) : undefined;

                if (typeof serviceCreator === 'string') {
                  // TODO: warn
                  return;
                }

                var source = isFunction$1(serviceCreator) ? serviceCreator(context, _event.data, {
                  data: resolvedData,
                  src: invokeSource,
                  meta: activity.meta
                }) : serviceCreator;

                if (!source) {
                  // TODO: warn?
                  return;
                }

                var options = void 0;

                if (isMachine(source)) {
                  source = resolvedData ? source.withContext(resolvedData) : source;
                  options = {
                    autoForward: autoForward
                  };
                }

                this.spawn(source, id, options);
              } else {
                this.spawnActivity(activity);
              }

              break;
            }

          case stop$2:
            {
              this.stopChild(action.activity.id);
              break;
            }

          case log$1:
            var label = action.label,
                value = action.value;

            if (label) {
              this.logger(label, value);
            } else {
              this.logger(value);
            }

            break;

          default:
            {
              warn(false, "No implementation found for action type '".concat(action.type, "'"));
            }

            break;
        }

        return undefined;
      };

      Interpreter.prototype.removeChild = function (childId) {
        var _a;

        this.children.delete(childId);
        this.forwardTo.delete(childId); // this.state might not exist at the time this is called,
        // such as when a child is added then removed while initializing the state

        (_a = this.state) === null || _a === void 0 ? true : delete _a.children[childId];
      };

      Interpreter.prototype.stopChild = function (childId) {
        var child = this.children.get(childId);

        if (!child) {
          return;
        }

        this.removeChild(childId);

        if (isFunction$1(child.stop)) {
          child.stop();
        }
      };

      Interpreter.prototype.spawn = function (entity, name, options) {
        if (isPromiseLike(entity)) {
          return this.spawnPromise(Promise.resolve(entity), name);
        } else if (isFunction$1(entity)) {
          return this.spawnCallback(entity, name);
        } else if (isSpawnedActor(entity)) {
          return this.spawnActor(entity, name);
        } else if (isObservable(entity)) {
          return this.spawnObservable(entity, name);
        } else if (isMachine(entity)) {
          return this.spawnMachine(entity, __assign$1(__assign$1({}, options), {
            id: name
          }));
        } else if (isBehavior(entity)) {
          return this.spawnBehavior(entity, name);
        } else {
          throw new Error("Unable to spawn entity \"".concat(name, "\" of type \"").concat(typeof entity, "\"."));
        }
      };

      Interpreter.prototype.spawnMachine = function (machine, options) {
        var _this = this;

        if (options === void 0) {
          options = {};
        }

        var childService = new Interpreter(machine, __assign$1(__assign$1({}, this.options), {
          parent: this,
          id: options.id || machine.id
        }));

        var resolvedOptions = __assign$1(__assign$1({}, DEFAULT_SPAWN_OPTIONS), options);

        if (resolvedOptions.sync) {
          childService.onTransition(function (state) {
            _this.send(update$1, {
              state: state,
              id: childService.id
            });
          });
        }

        var actor = childService;
        this.children.set(childService.id, actor);

        if (resolvedOptions.autoForward) {
          this.forwardTo.add(childService.id);
        }

        childService.onDone(function (doneEvent) {
          _this.removeChild(childService.id);

          _this.send(toSCXMLEvent(doneEvent, {
            origin: childService.id
          }));
        }).start();
        return actor;
      };

      Interpreter.prototype.spawnBehavior = function (behavior, id) {
        var actorRef = spawnBehavior(behavior, {
          id: id,
          parent: this
        });
        this.children.set(id, actorRef);
        return actorRef;
      };

      Interpreter.prototype.spawnPromise = function (promise, id) {
        var _a;

        var _this = this;

        var canceled = false;
        var resolvedData;
        promise.then(function (response) {
          if (!canceled) {
            resolvedData = response;

            _this.removeChild(id);

            _this.send(toSCXMLEvent(doneInvoke(id, response), {
              origin: id
            }));
          }
        }, function (errorData) {
          if (!canceled) {
            _this.removeChild(id);

            var errorEvent = error$1(id, errorData);

            try {
              // Send "error.platform.id" to this (parent).
              _this.send(toSCXMLEvent(errorEvent, {
                origin: id
              }));
            } catch (error) {
              reportUnhandledExceptionOnInvocation(errorData, error, id);

              if (_this.devTools) {
                _this.devTools.send(errorEvent, _this.state);
              }

              if (_this.machine.strict) {
                // it would be better to always stop the state machine if unhandled
                // exception/promise rejection happens but because we don't want to
                // break existing code so enforce it on strict mode only especially so
                // because documentation says that onError is optional
                _this.stop();
              }
            }
          }
        });
        var actor = (_a = {
          id: id,
          send: function () {
            return void 0;
          },
          subscribe: function (next, handleError, complete) {
            var observer = toObserver(next, handleError, complete);
            var unsubscribed = false;
            promise.then(function (response) {
              if (unsubscribed) {
                return;
              }

              observer.next(response);

              if (unsubscribed) {
                return;
              }

              observer.complete();
            }, function (err) {
              if (unsubscribed) {
                return;
              }

              observer.error(err);
            });
            return {
              unsubscribe: function () {
                return unsubscribed = true;
              }
            };
          },
          stop: function () {
            canceled = true;
          },
          toJSON: function () {
            return {
              id: id
            };
          },
          getSnapshot: function () {
            return resolvedData;
          }
        }, _a[symbolObservable] = function () {
          return this;
        }, _a);
        this.children.set(id, actor);
        return actor;
      };

      Interpreter.prototype.spawnCallback = function (callback, id) {
        var _a;

        var _this = this;

        var canceled = false;
        var receivers = new Set();
        var listeners = new Set();
        var emitted;

        var receive = function (e) {
          emitted = e;
          listeners.forEach(function (listener) {
            return listener(e);
          });

          if (canceled) {
            return;
          }

          _this.send(toSCXMLEvent(e, {
            origin: id
          }));
        };

        var callbackStop;

        try {
          callbackStop = callback(receive, function (newListener) {
            receivers.add(newListener);
          });
        } catch (err) {
          this.send(error$1(id, err));
        }

        if (isPromiseLike(callbackStop)) {
          // it turned out to be an async function, can't reliably check this before calling `callback`
          // because transpiled async functions are not recognizable
          return this.spawnPromise(callbackStop, id);
        }

        var actor = (_a = {
          id: id,
          send: function (event) {
            return receivers.forEach(function (receiver) {
              return receiver(event);
            });
          },
          subscribe: function (next) {
            var observer = toObserver(next);
            listeners.add(observer.next);
            return {
              unsubscribe: function () {
                listeners.delete(observer.next);
              }
            };
          },
          stop: function () {
            canceled = true;

            if (isFunction$1(callbackStop)) {
              callbackStop();
            }
          },
          toJSON: function () {
            return {
              id: id
            };
          },
          getSnapshot: function () {
            return emitted;
          }
        }, _a[symbolObservable] = function () {
          return this;
        }, _a);
        this.children.set(id, actor);
        return actor;
      };

      Interpreter.prototype.spawnObservable = function (source, id) {
        var _a;

        var _this = this;

        var emitted;
        var subscription = source.subscribe(function (value) {
          emitted = value;

          _this.send(toSCXMLEvent(value, {
            origin: id
          }));
        }, function (err) {
          _this.removeChild(id);

          _this.send(toSCXMLEvent(error$1(id, err), {
            origin: id
          }));
        }, function () {
          _this.removeChild(id);

          _this.send(toSCXMLEvent(doneInvoke(id), {
            origin: id
          }));
        });
        var actor = (_a = {
          id: id,
          send: function () {
            return void 0;
          },
          subscribe: function (next, handleError, complete) {
            return source.subscribe(next, handleError, complete);
          },
          stop: function () {
            return subscription.unsubscribe();
          },
          getSnapshot: function () {
            return emitted;
          },
          toJSON: function () {
            return {
              id: id
            };
          }
        }, _a[symbolObservable] = function () {
          return this;
        }, _a);
        this.children.set(id, actor);
        return actor;
      };

      Interpreter.prototype.spawnActor = function (actor, name) {
        this.children.set(name, actor);
        return actor;
      };

      Interpreter.prototype.spawnActivity = function (activity) {
        var implementation = this.machine.options && this.machine.options.activities ? this.machine.options.activities[activity.type] : undefined;

        if (!implementation) {
          {
            warn(false, "No implementation found for activity '".concat(activity.type, "'"));
          } // tslint:disable-next-line:no-console


          return;
        } // Start implementation


        var dispose = implementation(this.state.context, activity);
        this.spawnEffect(activity.id, dispose);
      };

      Interpreter.prototype.spawnEffect = function (id, dispose) {
        var _a;

        this.children.set(id, (_a = {
          id: id,
          send: function () {
            return void 0;
          },
          subscribe: function () {
            return {
              unsubscribe: function () {
                return void 0;
              }
            };
          },
          stop: dispose || undefined,
          getSnapshot: function () {
            return undefined;
          },
          toJSON: function () {
            return {
              id: id
            };
          }
        }, _a[symbolObservable] = function () {
          return this;
        }, _a));
      };

      Interpreter.prototype.attachDev = function () {
        var global = getGlobal();

        if (this.options.devTools && global) {
          if (global.__REDUX_DEVTOOLS_EXTENSION__) {
            var devToolsOptions = typeof this.options.devTools === 'object' ? this.options.devTools : undefined;
            this.devTools = global.__REDUX_DEVTOOLS_EXTENSION__.connect(__assign$1(__assign$1({
              name: this.id,
              autoPause: true,
              stateSanitizer: function (state) {
                return {
                  value: state.value,
                  context: state.context,
                  actions: state.actions
                };
              }
            }, devToolsOptions), {
              features: __assign$1({
                jump: false,
                skip: false
              }, devToolsOptions ? devToolsOptions.features : undefined)
            }), this.machine);
            this.devTools.init(this.state);
          } // add XState-specific dev tooling hook


          registerService(this);
        }
      };

      Interpreter.prototype.toJSON = function () {
        return {
          id: this.id
        };
      };

      Interpreter.prototype[symbolObservable] = function () {
        return this;
      };

      Interpreter.prototype.getSnapshot = function () {
        if (this.status === InterpreterStatus.NotStarted) {
          return this.initialState;
        }

        return this._state;
      };
      /**
       * The default interpreter options:
       *
       * - `clock` uses the global `setTimeout` and `clearTimeout` functions
       * - `logger` uses the global `console.log()` method
       */


      Interpreter.defaultOptions = {
        execute: true,
        deferEvents: true,
        clock: {
          setTimeout: function (fn, ms) {
            return setTimeout(fn, ms);
          },
          clearTimeout: function (id) {
            return clearTimeout(id);
          }
        },
        logger: /*#__PURE__*/console.log.bind(console),
        devTools: false
      };
      Interpreter.interpret = interpret;
      return Interpreter;
    }();

    var resolveSpawnOptions = function (nameOrOptions) {
      if (isString$1(nameOrOptions)) {
        return __assign$1(__assign$1({}, DEFAULT_SPAWN_OPTIONS), {
          name: nameOrOptions
        });
      }

      return __assign$1(__assign$1(__assign$1({}, DEFAULT_SPAWN_OPTIONS), {
        name: uniqueId()
      }), nameOrOptions);
    };

    function spawn(entity, nameOrOptions) {
      var resolvedOptions = resolveSpawnOptions(nameOrOptions);
      return consume(function (service) {
        if (!IS_PRODUCTION$1) {
          var isLazyEntity = isMachine(entity) || isFunction$1(entity);
          warn(!!service || isLazyEntity, "Attempted to spawn an Actor (ID: \"".concat(isMachine(entity) ? entity.id : 'undefined', "\") outside of a service. This will have no effect."));
        }

        if (service) {
          return service.spawn(entity, resolvedOptions.name, resolvedOptions);
        } else {
          return createDeferredActor(entity, resolvedOptions.name);
        }
      });
    }
    /**
     * Creates a new Interpreter instance for the given machine with the provided options, if any.
     *
     * @param machine The machine to interpret
     * @param options Interpreter options
     */

    function interpret(machine, options) {
      var interpreter = new Interpreter(machine, options);
      return interpreter;
    }

    function toInvokeSource(src) {
      if (typeof src === 'string') {
        var simpleSrc = {
          type: src
        };

        simpleSrc.toString = function () {
          return src;
        }; // v4 compat - TODO: remove in v5


        return simpleSrc;
      }

      return src;
    }
    function toInvokeDefinition(invokeConfig) {
      return __assign$1(__assign$1({
        type: invoke$1
      }, invokeConfig), {
        toJSON: function () {
          invokeConfig.onDone;
              invokeConfig.onError;
              var invokeDef = __rest(invokeConfig, ["onDone", "onError"]);

          return __assign$1(__assign$1({}, invokeDef), {
            type: invoke$1,
            src: toInvokeSource(invokeConfig.src)
          });
        }
      });
    }

    var NULL_EVENT = '';
    var STATE_IDENTIFIER = '#';
    var WILDCARD = '*';
    var EMPTY_OBJECT = {};

    var isStateId = function (str) {
      return str[0] === STATE_IDENTIFIER;
    };

    var createDefaultOptions = function () {
      return {
        actions: {},
        guards: {},
        services: {},
        activities: {},
        delays: {}
      };
    };

    var validateArrayifiedTransitions = function (stateNode, event, transitions) {
      var hasNonLastUnguardedTarget = transitions.slice(0, -1).some(function (transition) {
        return !('cond' in transition) && !('in' in transition) && (isString$1(transition.target) || isMachine(transition.target));
      });
      var eventText = event === NULL_EVENT ? 'the transient event' : "event '".concat(event, "'");
      warn(!hasNonLastUnguardedTarget, "One or more transitions for ".concat(eventText, " on state '").concat(stateNode.id, "' are unreachable. ") + "Make sure that the default transition is the last one defined.");
    };

    var StateNode =
    /*#__PURE__*/

    /** @class */
    function () {
      function StateNode(
      /**
       * The raw config used to create the machine.
       */
      config, options,
      /**
       * The initial extended state
       */
      _context, // TODO: this is unsafe, but we're removing it in v5 anyway
      _stateInfo) {
        var _this = this;

        if (_context === void 0) {
          _context = 'context' in config ? config.context : undefined;
        }

        var _a;

        this.config = config;
        this._context = _context;
        /**
         * The order this state node appears. Corresponds to the implicit SCXML document order.
         */

        this.order = -1;
        this.__xstatenode = true;
        this.__cache = {
          events: undefined,
          relativeValue: new Map(),
          initialStateValue: undefined,
          initialState: undefined,
          on: undefined,
          transitions: undefined,
          candidates: {},
          delayedTransitions: undefined
        };
        this.idMap = {};
        this.tags = [];
        this.options = Object.assign(createDefaultOptions(), options);
        this.parent = _stateInfo === null || _stateInfo === void 0 ? void 0 : _stateInfo.parent;
        this.key = this.config.key || (_stateInfo === null || _stateInfo === void 0 ? void 0 : _stateInfo.key) || this.config.id || '(machine)';
        this.machine = this.parent ? this.parent.machine : this;
        this.path = this.parent ? this.parent.path.concat(this.key) : [];
        this.delimiter = this.config.delimiter || (this.parent ? this.parent.delimiter : STATE_DELIMITER$1);
        this.id = this.config.id || __spreadArray([this.machine.key], __read(this.path), false).join(this.delimiter);
        this.version = this.parent ? this.parent.version : this.config.version;
        this.type = this.config.type || (this.config.parallel ? 'parallel' : this.config.states && Object.keys(this.config.states).length ? 'compound' : this.config.history ? 'history' : 'atomic');
        this.schema = this.parent ? this.machine.schema : (_a = this.config.schema) !== null && _a !== void 0 ? _a : {};
        this.description = this.config.description;

        {
          warn(!('parallel' in this.config), "The \"parallel\" property is deprecated and will be removed in version 4.1. ".concat(this.config.parallel ? "Replace with `type: 'parallel'`" : "Use `type: '".concat(this.type, "'`"), " in the config for state node '").concat(this.id, "' instead."));
        }

        this.initial = this.config.initial;
        this.states = this.config.states ? mapValues(this.config.states, function (stateConfig, key) {
          var _a;

          var stateNode = new StateNode(stateConfig, {}, undefined, {
            parent: _this,
            key: key
          });
          Object.assign(_this.idMap, __assign$1((_a = {}, _a[stateNode.id] = stateNode, _a), stateNode.idMap));
          return stateNode;
        }) : EMPTY_OBJECT; // Document order

        var order = 0;

        function dfs(stateNode) {
          var e_1, _a;

          stateNode.order = order++;

          try {
            for (var _b = __values$1(getChildren(stateNode)), _c = _b.next(); !_c.done; _c = _b.next()) {
              var child = _c.value;
              dfs(child);
            }
          } catch (e_1_1) {
            e_1 = {
              error: e_1_1
            };
          } finally {
            try {
              if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            } finally {
              if (e_1) throw e_1.error;
            }
          }
        }

        dfs(this); // History config

        this.history = this.config.history === true ? 'shallow' : this.config.history || false;
        this._transient = !!this.config.always || (!this.config.on ? false : Array.isArray(this.config.on) ? this.config.on.some(function (_a) {
          var event = _a.event;
          return event === NULL_EVENT;
        }) : NULL_EVENT in this.config.on);
        this.strict = !!this.config.strict; // TODO: deprecate (entry)

        this.onEntry = toArray(this.config.entry || this.config.onEntry).map(function (action) {
          return toActionObject(action);
        }); // TODO: deprecate (exit)

        this.onExit = toArray(this.config.exit || this.config.onExit).map(function (action) {
          return toActionObject(action);
        });
        this.meta = this.config.meta;
        this.doneData = this.type === 'final' ? this.config.data : undefined;
        this.invoke = toArray(this.config.invoke).map(function (invokeConfig, i) {
          var _a, _b;

          if (isMachine(invokeConfig)) {
            var invokeId = createInvokeId(_this.id, i);
            _this.machine.options.services = __assign$1((_a = {}, _a[invokeId] = invokeConfig, _a), _this.machine.options.services);
            return toInvokeDefinition({
              src: invokeId,
              id: invokeId
            });
          } else if (isString$1(invokeConfig.src)) {
            var invokeId = invokeConfig.id || createInvokeId(_this.id, i);
            return toInvokeDefinition(__assign$1(__assign$1({}, invokeConfig), {
              id: invokeId,
              src: invokeConfig.src
            }));
          } else if (isMachine(invokeConfig.src) || isFunction$1(invokeConfig.src)) {
            var invokeId = invokeConfig.id || createInvokeId(_this.id, i);
            _this.machine.options.services = __assign$1((_b = {}, _b[invokeId] = invokeConfig.src, _b), _this.machine.options.services);
            return toInvokeDefinition(__assign$1(__assign$1({
              id: invokeId
            }, invokeConfig), {
              src: invokeId
            }));
          } else {
            var invokeSource = invokeConfig.src;
            return toInvokeDefinition(__assign$1(__assign$1({
              id: createInvokeId(_this.id, i)
            }, invokeConfig), {
              src: invokeSource
            }));
          }
        });
        this.activities = toArray(this.config.activities).concat(this.invoke).map(function (activity) {
          return toActivityDefinition(activity);
        });
        this.transition = this.transition.bind(this);
        this.tags = toArray(this.config.tags); // TODO: this is the real fix for initialization once
        // state node getters are deprecated
        // if (!this.parent) {
        //   this._init();
        // }
      }

      StateNode.prototype._init = function () {
        if (this.__cache.transitions) {
          return;
        }

        getAllStateNodes(this).forEach(function (stateNode) {
          return stateNode.on;
        });
      };
      /**
       * Clones this state machine with custom options and context.
       *
       * @param options Options (actions, guards, activities, services) to recursively merge with the existing options.
       * @param context Custom context (will override predefined context)
       */


      StateNode.prototype.withConfig = function (options, context) {
        var _a = this.options,
            actions = _a.actions,
            activities = _a.activities,
            guards = _a.guards,
            services = _a.services,
            delays = _a.delays;
        return new StateNode(this.config, {
          actions: __assign$1(__assign$1({}, actions), options.actions),
          activities: __assign$1(__assign$1({}, activities), options.activities),
          guards: __assign$1(__assign$1({}, guards), options.guards),
          services: __assign$1(__assign$1({}, services), options.services),
          delays: __assign$1(__assign$1({}, delays), options.delays)
        }, context !== null && context !== void 0 ? context : this.context);
      };
      /**
       * Clones this state machine with custom context.
       *
       * @param context Custom context (will override predefined context, not recursive)
       */


      StateNode.prototype.withContext = function (context) {
        return new StateNode(this.config, this.options, context);
      };

      Object.defineProperty(StateNode.prototype, "context", {
        get: function () {
          return isFunction$1(this._context) ? this._context() : this._context;
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(StateNode.prototype, "definition", {
        /**
         * The well-structured state node definition.
         */
        get: function () {
          return {
            id: this.id,
            key: this.key,
            version: this.version,
            context: this.context,
            type: this.type,
            initial: this.initial,
            history: this.history,
            states: mapValues(this.states, function (state) {
              return state.definition;
            }),
            on: this.on,
            transitions: this.transitions,
            entry: this.onEntry,
            exit: this.onExit,
            activities: this.activities || [],
            meta: this.meta,
            order: this.order || -1,
            data: this.doneData,
            invoke: this.invoke,
            description: this.description,
            tags: this.tags
          };
        },
        enumerable: false,
        configurable: true
      });

      StateNode.prototype.toJSON = function () {
        return this.definition;
      };

      Object.defineProperty(StateNode.prototype, "on", {
        /**
         * The mapping of events to transitions.
         */
        get: function () {
          if (this.__cache.on) {
            return this.__cache.on;
          }

          var transitions = this.transitions;
          return this.__cache.on = transitions.reduce(function (map, transition) {
            map[transition.eventType] = map[transition.eventType] || [];
            map[transition.eventType].push(transition);
            return map;
          }, {});
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(StateNode.prototype, "after", {
        get: function () {
          return this.__cache.delayedTransitions || (this.__cache.delayedTransitions = this.getDelayedTransitions(), this.__cache.delayedTransitions);
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(StateNode.prototype, "transitions", {
        /**
         * All the transitions that can be taken from this state node.
         */
        get: function () {
          return this.__cache.transitions || (this.__cache.transitions = this.formatTransitions(), this.__cache.transitions);
        },
        enumerable: false,
        configurable: true
      });

      StateNode.prototype.getCandidates = function (eventName) {
        if (this.__cache.candidates[eventName]) {
          return this.__cache.candidates[eventName];
        }

        var transient = eventName === NULL_EVENT;
        var candidates = this.transitions.filter(function (transition) {
          var sameEventType = transition.eventType === eventName; // null events should only match against eventless transitions

          return transient ? sameEventType : sameEventType || transition.eventType === WILDCARD;
        });
        this.__cache.candidates[eventName] = candidates;
        return candidates;
      };
      /**
       * All delayed transitions from the config.
       */


      StateNode.prototype.getDelayedTransitions = function () {
        var _this = this;

        var afterConfig = this.config.after;

        if (!afterConfig) {
          return [];
        }

        var mutateEntryExit = function (delay, i) {
          var delayRef = isFunction$1(delay) ? "".concat(_this.id, ":delay[").concat(i, "]") : delay;
          var eventType = after$1(delayRef, _this.id);

          _this.onEntry.push(send$2(eventType, {
            delay: delay
          }));

          _this.onExit.push(cancel$1(eventType));

          return eventType;
        };

        var delayedTransitions = isArray$1(afterConfig) ? afterConfig.map(function (transition, i) {
          var eventType = mutateEntryExit(transition.delay, i);
          return __assign$1(__assign$1({}, transition), {
            event: eventType
          });
        }) : flatten(Object.keys(afterConfig).map(function (delay, i) {
          var configTransition = afterConfig[delay];
          var resolvedTransition = isString$1(configTransition) ? {
            target: configTransition
          } : configTransition;
          var resolvedDelay = !isNaN(+delay) ? +delay : delay;
          var eventType = mutateEntryExit(resolvedDelay, i);
          return toArray(resolvedTransition).map(function (transition) {
            return __assign$1(__assign$1({}, transition), {
              event: eventType,
              delay: resolvedDelay
            });
          });
        }));
        return delayedTransitions.map(function (delayedTransition) {
          var delay = delayedTransition.delay;
          return __assign$1(__assign$1({}, _this.formatTransition(delayedTransition)), {
            delay: delay
          });
        });
      };
      /**
       * Returns the state nodes represented by the current state value.
       *
       * @param state The state value or State instance
       */


      StateNode.prototype.getStateNodes = function (state) {
        var _a;

        var _this = this;

        if (!state) {
          return [];
        }

        var stateValue = state instanceof State ? state.value : toStateValue(state, this.delimiter);

        if (isString$1(stateValue)) {
          var initialStateValue = this.getStateNode(stateValue).initial;
          return initialStateValue !== undefined ? this.getStateNodes((_a = {}, _a[stateValue] = initialStateValue, _a)) : [this, this.states[stateValue]];
        }

        var subStateKeys = Object.keys(stateValue);
        var subStateNodes = [this];
        subStateNodes.push.apply(subStateNodes, __spreadArray([], __read(flatten(subStateKeys.map(function (subStateKey) {
          return _this.getStateNode(subStateKey).getStateNodes(stateValue[subStateKey]);
        }))), false));
        return subStateNodes;
      };
      /**
       * Returns `true` if this state node explicitly handles the given event.
       *
       * @param event The event in question
       */


      StateNode.prototype.handles = function (event) {
        var eventType = getEventType(event);
        return this.events.includes(eventType);
      };
      /**
       * Resolves the given `state` to a new `State` instance relative to this machine.
       *
       * This ensures that `.events` and `.nextEvents` represent the correct values.
       *
       * @param state The state to resolve
       */


      StateNode.prototype.resolveState = function (state) {
        var stateFromConfig = state instanceof State ? state : State.create(state);
        var configuration = Array.from(getConfiguration([], this.getStateNodes(stateFromConfig.value)));
        return new State(__assign$1(__assign$1({}, stateFromConfig), {
          value: this.resolve(stateFromConfig.value),
          configuration: configuration,
          done: isInFinalState(configuration, this),
          tags: getTagsFromConfiguration(configuration),
          machine: this.machine
        }));
      };

      StateNode.prototype.transitionLeafNode = function (stateValue, state, _event) {
        var stateNode = this.getStateNode(stateValue);
        var next = stateNode.next(state, _event);

        if (!next || !next.transitions.length) {
          return this.next(state, _event);
        }

        return next;
      };

      StateNode.prototype.transitionCompoundNode = function (stateValue, state, _event) {
        var subStateKeys = Object.keys(stateValue);
        var stateNode = this.getStateNode(subStateKeys[0]);

        var next = stateNode._transition(stateValue[subStateKeys[0]], state, _event);

        if (!next || !next.transitions.length) {
          return this.next(state, _event);
        }

        return next;
      };

      StateNode.prototype.transitionParallelNode = function (stateValue, state, _event) {
        var e_2, _a;

        var transitionMap = {};

        try {
          for (var _b = __values$1(Object.keys(stateValue)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var subStateKey = _c.value;
            var subStateValue = stateValue[subStateKey];

            if (!subStateValue) {
              continue;
            }

            var subStateNode = this.getStateNode(subStateKey);

            var next = subStateNode._transition(subStateValue, state, _event);

            if (next) {
              transitionMap[subStateKey] = next;
            }
          }
        } catch (e_2_1) {
          e_2 = {
            error: e_2_1
          };
        } finally {
          try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
          } finally {
            if (e_2) throw e_2.error;
          }
        }

        var stateTransitions = Object.keys(transitionMap).map(function (key) {
          return transitionMap[key];
        });
        var enabledTransitions = flatten(stateTransitions.map(function (st) {
          return st.transitions;
        }));
        var willTransition = stateTransitions.some(function (st) {
          return st.transitions.length > 0;
        });

        if (!willTransition) {
          return this.next(state, _event);
        }

        var entryNodes = flatten(stateTransitions.map(function (t) {
          return t.entrySet;
        }));
        var configuration = flatten(Object.keys(transitionMap).map(function (key) {
          return transitionMap[key].configuration;
        }));
        return {
          transitions: enabledTransitions,
          entrySet: entryNodes,
          exitSet: flatten(stateTransitions.map(function (t) {
            return t.exitSet;
          })),
          configuration: configuration,
          source: state,
          actions: flatten(Object.keys(transitionMap).map(function (key) {
            return transitionMap[key].actions;
          }))
        };
      };

      StateNode.prototype._transition = function (stateValue, state, _event) {
        // leaf node
        if (isString$1(stateValue)) {
          return this.transitionLeafNode(stateValue, state, _event);
        } // hierarchical node


        if (Object.keys(stateValue).length === 1) {
          return this.transitionCompoundNode(stateValue, state, _event);
        } // orthogonal node


        return this.transitionParallelNode(stateValue, state, _event);
      };

      StateNode.prototype.getTransitionData = function (state, event) {
        return this._transition(state.value, state, toSCXMLEvent(event));
      };

      StateNode.prototype.next = function (state, _event) {
        var e_3, _a;

        var _this = this;

        var eventName = _event.name;
        var actions = [];
        var nextStateNodes = [];
        var selectedTransition;

        try {
          for (var _b = __values$1(this.getCandidates(eventName)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var candidate = _c.value;
            var cond = candidate.cond,
                stateIn = candidate.in;
            var resolvedContext = state.context;
            var isInState = stateIn ? isString$1(stateIn) && isStateId(stateIn) ? // Check if in state by ID
            state.matches(toStateValue(this.getStateNodeById(stateIn).path, this.delimiter)) : // Check if in state by relative grandparent
            matchesState(toStateValue(stateIn, this.delimiter), path(this.path.slice(0, -2))(state.value)) : true;
            var guardPassed = false;

            try {
              guardPassed = !cond || evaluateGuard(this.machine, cond, resolvedContext, _event, state);
            } catch (err) {
              throw new Error("Unable to evaluate guard '".concat(cond.name || cond.type, "' in transition for event '").concat(eventName, "' in state node '").concat(this.id, "':\n").concat(err.message));
            }

            if (guardPassed && isInState) {
              if (candidate.target !== undefined) {
                nextStateNodes = candidate.target;
              }

              actions.push.apply(actions, __spreadArray([], __read(candidate.actions), false));
              selectedTransition = candidate;
              break;
            }
          }
        } catch (e_3_1) {
          e_3 = {
            error: e_3_1
          };
        } finally {
          try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
          } finally {
            if (e_3) throw e_3.error;
          }
        }

        if (!selectedTransition) {
          return undefined;
        }

        if (!nextStateNodes.length) {
          return {
            transitions: [selectedTransition],
            entrySet: [],
            exitSet: [],
            configuration: state.value ? [this] : [],
            source: state,
            actions: actions
          };
        }

        var allNextStateNodes = flatten(nextStateNodes.map(function (stateNode) {
          return _this.getRelativeStateNodes(stateNode, state.historyValue);
        }));
        var isInternal = !!selectedTransition.internal;
        var reentryNodes = isInternal ? [] : flatten(allNextStateNodes.map(function (n) {
          return _this.nodesFromChild(n);
        }));
        return {
          transitions: [selectedTransition],
          entrySet: reentryNodes,
          exitSet: isInternal ? [] : [this],
          configuration: allNextStateNodes,
          source: state,
          actions: actions
        };
      };

      StateNode.prototype.nodesFromChild = function (childStateNode) {
        if (childStateNode.escapes(this)) {
          return [];
        }

        var nodes = [];
        var marker = childStateNode;

        while (marker && marker !== this) {
          nodes.push(marker);
          marker = marker.parent;
        }

        nodes.push(this); // inclusive

        return nodes;
      };
      /**
       * Whether the given state node "escapes" this state node. If the `stateNode` is equal to or the parent of
       * this state node, it does not escape.
       */


      StateNode.prototype.escapes = function (stateNode) {
        if (this === stateNode) {
          return false;
        }

        var parent = this.parent;

        while (parent) {
          if (parent === stateNode) {
            return false;
          }

          parent = parent.parent;
        }

        return true;
      };

      StateNode.prototype.getActions = function (transition, currentContext, _event, prevState) {
        var e_4, _a, e_5, _b;

        var prevConfig = getConfiguration([], prevState ? this.getStateNodes(prevState.value) : [this]);
        var resolvedConfig = transition.configuration.length ? getConfiguration(prevConfig, transition.configuration) : prevConfig;

        try {
          for (var resolvedConfig_1 = __values$1(resolvedConfig), resolvedConfig_1_1 = resolvedConfig_1.next(); !resolvedConfig_1_1.done; resolvedConfig_1_1 = resolvedConfig_1.next()) {
            var sn = resolvedConfig_1_1.value;

            if (!has(prevConfig, sn)) {
              transition.entrySet.push(sn);
            }
          }
        } catch (e_4_1) {
          e_4 = {
            error: e_4_1
          };
        } finally {
          try {
            if (resolvedConfig_1_1 && !resolvedConfig_1_1.done && (_a = resolvedConfig_1.return)) _a.call(resolvedConfig_1);
          } finally {
            if (e_4) throw e_4.error;
          }
        }

        try {
          for (var prevConfig_1 = __values$1(prevConfig), prevConfig_1_1 = prevConfig_1.next(); !prevConfig_1_1.done; prevConfig_1_1 = prevConfig_1.next()) {
            var sn = prevConfig_1_1.value;

            if (!has(resolvedConfig, sn) || has(transition.exitSet, sn.parent)) {
              transition.exitSet.push(sn);
            }
          }
        } catch (e_5_1) {
          e_5 = {
            error: e_5_1
          };
        } finally {
          try {
            if (prevConfig_1_1 && !prevConfig_1_1.done && (_b = prevConfig_1.return)) _b.call(prevConfig_1);
          } finally {
            if (e_5) throw e_5.error;
          }
        }

        var doneEvents = flatten(transition.entrySet.map(function (sn) {
          var events = [];

          if (sn.type !== 'final') {
            return events;
          }

          var parent = sn.parent;

          if (!parent.parent) {
            return events;
          }

          events.push(done(sn.id, sn.doneData), // TODO: deprecate - final states should not emit done events for their own state.
          done(parent.id, sn.doneData ? mapContext(sn.doneData, currentContext, _event) : undefined));
          var grandparent = parent.parent;

          if (grandparent.type === 'parallel') {
            if (getChildren(grandparent).every(function (parentNode) {
              return isInFinalState(transition.configuration, parentNode);
            })) {
              events.push(done(grandparent.id));
            }
          }

          return events;
        }));
        transition.exitSet.sort(function (a, b) {
          return b.order - a.order;
        });
        transition.entrySet.sort(function (a, b) {
          return a.order - b.order;
        });
        var entryStates = new Set(transition.entrySet);
        var exitStates = new Set(transition.exitSet);

        var _c = __read([flatten(Array.from(entryStates).map(function (stateNode) {
          return __spreadArray(__spreadArray([], __read(stateNode.activities.map(function (activity) {
            return start$1(activity);
          })), false), __read(stateNode.onEntry), false);
        })).concat(doneEvents.map(raise$1)), flatten(Array.from(exitStates).map(function (stateNode) {
          return __spreadArray(__spreadArray([], __read(stateNode.onExit), false), __read(stateNode.activities.map(function (activity) {
            return stop$1(activity);
          })), false);
        }))], 2),
            entryActions = _c[0],
            exitActions = _c[1];

        var actions = toActionObjects(exitActions.concat(transition.actions).concat(entryActions), this.machine.options.actions);
        return actions;
      };
      /**
       * Determines the next state given the current `state` and sent `event`.
       *
       * @param state The current State instance or state value
       * @param event The event that was sent at the current state
       * @param context The current context (extended state) of the current state
       */


      StateNode.prototype.transition = function (state, event, context) {
        if (state === void 0) {
          state = this.initialState;
        }

        var _event = toSCXMLEvent(event);

        var currentState;

        if (state instanceof State) {
          currentState = context === undefined ? state : this.resolveState(State.from(state, context));
        } else {
          var resolvedStateValue = isString$1(state) ? this.resolve(pathToStateValue(this.getResolvedPath(state))) : this.resolve(state);
          var resolvedContext = context !== null && context !== void 0 ? context : this.machine.context;
          currentState = this.resolveState(State.from(resolvedStateValue, resolvedContext));
        }

        if (_event.name === WILDCARD) {
          throw new Error("An event cannot have the wildcard type ('".concat(WILDCARD, "')"));
        }

        if (this.strict) {
          if (!this.events.includes(_event.name) && !isBuiltInEvent(_event.name)) {
            throw new Error("Machine '".concat(this.id, "' does not accept event '").concat(_event.name, "'"));
          }
        }

        var stateTransition = this._transition(currentState.value, currentState, _event) || {
          transitions: [],
          configuration: [],
          entrySet: [],
          exitSet: [],
          source: currentState,
          actions: []
        };
        var prevConfig = getConfiguration([], this.getStateNodes(currentState.value));
        var resolvedConfig = stateTransition.configuration.length ? getConfiguration(prevConfig, stateTransition.configuration) : prevConfig;
        stateTransition.configuration = __spreadArray([], __read(resolvedConfig), false);
        return this.resolveTransition(stateTransition, currentState, currentState.context, _event);
      };

      StateNode.prototype.resolveRaisedTransition = function (state, _event, originalEvent) {
        var _a;

        var currentActions = state.actions;
        state = this.transition(state, _event); // Save original event to state
        // TODO: this should be the raised event! Delete in V5 (breaking)

        state._event = originalEvent;
        state.event = originalEvent.data;

        (_a = state.actions).unshift.apply(_a, __spreadArray([], __read(currentActions), false));

        return state;
      };

      StateNode.prototype.resolveTransition = function (stateTransition, currentState, context, _event) {
        var e_6, _a;

        var _this = this;

        if (_event === void 0) {
          _event = initEvent;
        }

        var configuration = stateTransition.configuration; // Transition will "apply" if:
        // - this is the initial state (there is no current state)
        // - OR there are transitions

        var willTransition = !currentState || stateTransition.transitions.length > 0;
        var resolvedStateValue = willTransition ? getValue(this.machine, configuration) : undefined;
        var historyValue = currentState ? currentState.historyValue ? currentState.historyValue : stateTransition.source ? this.machine.historyValue(currentState.value) : undefined : undefined;
        var actions = this.getActions(stateTransition, context, _event, currentState);
        var activities = currentState ? __assign$1({}, currentState.activities) : {};

        try {
          for (var actions_1 = __values$1(actions), actions_1_1 = actions_1.next(); !actions_1_1.done; actions_1_1 = actions_1.next()) {
            var action = actions_1_1.value;

            if (action.type === start$2) {
              activities[action.activity.id || action.activity.type] = action;
            } else if (action.type === stop$2) {
              activities[action.activity.id || action.activity.type] = false;
            }
          }
        } catch (e_6_1) {
          e_6 = {
            error: e_6_1
          };
        } finally {
          try {
            if (actions_1_1 && !actions_1_1.done && (_a = actions_1.return)) _a.call(actions_1);
          } finally {
            if (e_6) throw e_6.error;
          }
        }

        var _b = __read(resolveActions(this, currentState, context, _event, actions, this.machine.config.preserveActionOrder), 2),
            resolvedActions = _b[0],
            updatedContext = _b[1];

        var _c = __read(partition(resolvedActions, function (action) {
          return action.type === raise$2 || action.type === send$3 && action.to === SpecialTargets.Internal;
        }), 2),
            raisedEvents = _c[0],
            nonRaisedActions = _c[1];

        var invokeActions = resolvedActions.filter(function (action) {
          var _a;

          return action.type === start$2 && ((_a = action.activity) === null || _a === void 0 ? void 0 : _a.type) === invoke$1;
        });
        var children = invokeActions.reduce(function (acc, action) {
          acc[action.activity.id] = createInvocableActor(action.activity, _this.machine, updatedContext, _event);
          return acc;
        }, currentState ? __assign$1({}, currentState.children) : {});
        var resolvedConfiguration = willTransition ? stateTransition.configuration : currentState ? currentState.configuration : [];
        var isDone = isInFinalState(resolvedConfiguration, this);
        var nextState = new State({
          value: resolvedStateValue || currentState.value,
          context: updatedContext,
          _event: _event,
          // Persist _sessionid between states
          _sessionid: currentState ? currentState._sessionid : null,
          historyValue: resolvedStateValue ? historyValue ? updateHistoryValue(historyValue, resolvedStateValue) : undefined : currentState ? currentState.historyValue : undefined,
          history: !resolvedStateValue || stateTransition.source ? currentState : undefined,
          actions: resolvedStateValue ? nonRaisedActions : [],
          activities: resolvedStateValue ? activities : currentState ? currentState.activities : {},
          events: [],
          configuration: resolvedConfiguration,
          transitions: stateTransition.transitions,
          children: children,
          done: isDone,
          tags: currentState === null || currentState === void 0 ? void 0 : currentState.tags,
          machine: this
        });
        var didUpdateContext = context !== updatedContext;
        nextState.changed = _event.name === update$1 || didUpdateContext; // Dispose of penultimate histories to prevent memory leaks

        var history = nextState.history;

        if (history) {
          delete history.history;
        } // There are transient transitions if the machine is not in a final state
        // and if some of the state nodes have transient ("always") transitions.


        var isTransient = !isDone && (this._transient || configuration.some(function (stateNode) {
          return stateNode._transient;
        })); // If there are no enabled transitions, check if there are transient transitions.
        // If there are transient transitions, continue checking for more transitions
        // because an transient transition should be triggered even if there are no
        // enabled transitions.
        //
        // If we're already working on an transient transition (by checking
        // if the event is a NULL_EVENT), then stop to prevent an infinite loop.
        //
        // Otherwise, if there are no enabled nor transient transitions, we are done.

        if (!willTransition && (!isTransient || _event.name === NULL_EVENT)) {
          return nextState;
        }

        var maybeNextState = nextState;

        if (!isDone) {
          if (isTransient) {
            maybeNextState = this.resolveRaisedTransition(maybeNextState, {
              type: nullEvent$1
            }, _event);
          }

          while (raisedEvents.length) {
            var raisedEvent = raisedEvents.shift();
            maybeNextState = this.resolveRaisedTransition(maybeNextState, raisedEvent._event, _event);
          }
        } // Detect if state changed


        var changed = maybeNextState.changed || (history ? !!maybeNextState.actions.length || didUpdateContext || typeof history.value !== typeof maybeNextState.value || !stateValuesEqual(maybeNextState.value, history.value) : undefined);
        maybeNextState.changed = changed; // Preserve original history after raised events

        maybeNextState.history = history;
        maybeNextState.tags = getTagsFromConfiguration(maybeNextState.configuration);
        return maybeNextState;
      };
      /**
       * Returns the child state node from its relative `stateKey`, or throws.
       */


      StateNode.prototype.getStateNode = function (stateKey) {
        if (isStateId(stateKey)) {
          return this.machine.getStateNodeById(stateKey);
        }

        if (!this.states) {
          throw new Error("Unable to retrieve child state '".concat(stateKey, "' from '").concat(this.id, "'; no child states exist."));
        }

        var result = this.states[stateKey];

        if (!result) {
          throw new Error("Child state '".concat(stateKey, "' does not exist on '").concat(this.id, "'"));
        }

        return result;
      };
      /**
       * Returns the state node with the given `stateId`, or throws.
       *
       * @param stateId The state ID. The prefix "#" is removed.
       */


      StateNode.prototype.getStateNodeById = function (stateId) {
        var resolvedStateId = isStateId(stateId) ? stateId.slice(STATE_IDENTIFIER.length) : stateId;

        if (resolvedStateId === this.id) {
          return this;
        }

        var stateNode = this.machine.idMap[resolvedStateId];

        if (!stateNode) {
          throw new Error("Child state node '#".concat(resolvedStateId, "' does not exist on machine '").concat(this.id, "'"));
        }

        return stateNode;
      };
      /**
       * Returns the relative state node from the given `statePath`, or throws.
       *
       * @param statePath The string or string array relative path to the state node.
       */


      StateNode.prototype.getStateNodeByPath = function (statePath) {
        if (typeof statePath === 'string' && isStateId(statePath)) {
          try {
            return this.getStateNodeById(statePath.slice(1));
          } catch (e) {// try individual paths
            // throw e;
          }
        }

        var arrayStatePath = toStatePath(statePath, this.delimiter).slice();
        var currentStateNode = this;

        while (arrayStatePath.length) {
          var key = arrayStatePath.shift();

          if (!key.length) {
            break;
          }

          currentStateNode = currentStateNode.getStateNode(key);
        }

        return currentStateNode;
      };
      /**
       * Resolves a partial state value with its full representation in this machine.
       *
       * @param stateValue The partial state value to resolve.
       */


      StateNode.prototype.resolve = function (stateValue) {
        var _a;

        var _this = this;

        if (!stateValue) {
          return this.initialStateValue || EMPTY_OBJECT; // TODO: type-specific properties
        }

        switch (this.type) {
          case 'parallel':
            return mapValues(this.initialStateValue, function (subStateValue, subStateKey) {
              return subStateValue ? _this.getStateNode(subStateKey).resolve(stateValue[subStateKey] || subStateValue) : EMPTY_OBJECT;
            });

          case 'compound':
            if (isString$1(stateValue)) {
              var subStateNode = this.getStateNode(stateValue);

              if (subStateNode.type === 'parallel' || subStateNode.type === 'compound') {
                return _a = {}, _a[stateValue] = subStateNode.initialStateValue, _a;
              }

              return stateValue;
            }

            if (!Object.keys(stateValue).length) {
              return this.initialStateValue || {};
            }

            return mapValues(stateValue, function (subStateValue, subStateKey) {
              return subStateValue ? _this.getStateNode(subStateKey).resolve(subStateValue) : EMPTY_OBJECT;
            });

          default:
            return stateValue || EMPTY_OBJECT;
        }
      };

      StateNode.prototype.getResolvedPath = function (stateIdentifier) {
        if (isStateId(stateIdentifier)) {
          var stateNode = this.machine.idMap[stateIdentifier.slice(STATE_IDENTIFIER.length)];

          if (!stateNode) {
            throw new Error("Unable to find state node '".concat(stateIdentifier, "'"));
          }

          return stateNode.path;
        }

        return toStatePath(stateIdentifier, this.delimiter);
      };

      Object.defineProperty(StateNode.prototype, "initialStateValue", {
        get: function () {
          var _a;

          if (this.__cache.initialStateValue) {
            return this.__cache.initialStateValue;
          }

          var initialStateValue;

          if (this.type === 'parallel') {
            initialStateValue = mapFilterValues(this.states, function (state) {
              return state.initialStateValue || EMPTY_OBJECT;
            }, function (stateNode) {
              return !(stateNode.type === 'history');
            });
          } else if (this.initial !== undefined) {
            if (!this.states[this.initial]) {
              throw new Error("Initial state '".concat(this.initial, "' not found on '").concat(this.key, "'"));
            }

            initialStateValue = isLeafNode(this.states[this.initial]) ? this.initial : (_a = {}, _a[this.initial] = this.states[this.initial].initialStateValue, _a);
          } else {
            // The finite state value of a machine without child states is just an empty object
            initialStateValue = {};
          }

          this.__cache.initialStateValue = initialStateValue;
          return this.__cache.initialStateValue;
        },
        enumerable: false,
        configurable: true
      });

      StateNode.prototype.getInitialState = function (stateValue, context) {
        this._init(); // TODO: this should be in the constructor (see note in constructor)


        var configuration = this.getStateNodes(stateValue);
        return this.resolveTransition({
          configuration: configuration,
          entrySet: configuration,
          exitSet: [],
          transitions: [],
          source: undefined,
          actions: []
        }, undefined, context !== null && context !== void 0 ? context : this.machine.context, undefined);
      };

      Object.defineProperty(StateNode.prototype, "initialState", {
        /**
         * The initial State instance, which includes all actions to be executed from
         * entering the initial state.
         */
        get: function () {
          var initialStateValue = this.initialStateValue;

          if (!initialStateValue) {
            throw new Error("Cannot retrieve initial state from simple state '".concat(this.id, "'."));
          }

          return this.getInitialState(initialStateValue);
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(StateNode.prototype, "target", {
        /**
         * The target state value of the history state node, if it exists. This represents the
         * default state value to transition to if no history value exists yet.
         */
        get: function () {
          var target;

          if (this.type === 'history') {
            var historyConfig = this.config;

            if (isString$1(historyConfig.target)) {
              target = isStateId(historyConfig.target) ? pathToStateValue(this.machine.getStateNodeById(historyConfig.target).path.slice(this.path.length - 1)) : historyConfig.target;
            } else {
              target = historyConfig.target;
            }
          }

          return target;
        },
        enumerable: false,
        configurable: true
      });
      /**
       * Returns the leaf nodes from a state path relative to this state node.
       *
       * @param relativeStateId The relative state path to retrieve the state nodes
       * @param history The previous state to retrieve history
       * @param resolve Whether state nodes should resolve to initial child state nodes
       */

      StateNode.prototype.getRelativeStateNodes = function (relativeStateId, historyValue, resolve) {
        if (resolve === void 0) {
          resolve = true;
        }

        return resolve ? relativeStateId.type === 'history' ? relativeStateId.resolveHistory(historyValue) : relativeStateId.initialStateNodes : [relativeStateId];
      };

      Object.defineProperty(StateNode.prototype, "initialStateNodes", {
        get: function () {
          var _this = this;

          if (isLeafNode(this)) {
            return [this];
          } // Case when state node is compound but no initial state is defined


          if (this.type === 'compound' && !this.initial) {
            {
              warn(false, "Compound state node '".concat(this.id, "' has no initial state."));
            }

            return [this];
          }

          var initialStateNodePaths = toStatePaths(this.initialStateValue);
          return flatten(initialStateNodePaths.map(function (initialPath) {
            return _this.getFromRelativePath(initialPath);
          }));
        },
        enumerable: false,
        configurable: true
      });
      /**
       * Retrieves state nodes from a relative path to this state node.
       *
       * @param relativePath The relative path from this state node
       * @param historyValue
       */

      StateNode.prototype.getFromRelativePath = function (relativePath) {
        if (!relativePath.length) {
          return [this];
        }

        var _a = __read(relativePath),
            stateKey = _a[0],
            childStatePath = _a.slice(1);

        if (!this.states) {
          throw new Error("Cannot retrieve subPath '".concat(stateKey, "' from node with no states"));
        }

        var childStateNode = this.getStateNode(stateKey);

        if (childStateNode.type === 'history') {
          return childStateNode.resolveHistory();
        }

        if (!this.states[stateKey]) {
          throw new Error("Child state '".concat(stateKey, "' does not exist on '").concat(this.id, "'"));
        }

        return this.states[stateKey].getFromRelativePath(childStatePath);
      };

      StateNode.prototype.historyValue = function (relativeStateValue) {
        if (!Object.keys(this.states).length) {
          return undefined;
        }

        return {
          current: relativeStateValue || this.initialStateValue,
          states: mapFilterValues(this.states, function (stateNode, key) {
            if (!relativeStateValue) {
              return stateNode.historyValue();
            }

            var subStateValue = isString$1(relativeStateValue) ? undefined : relativeStateValue[key];
            return stateNode.historyValue(subStateValue || stateNode.initialStateValue);
          }, function (stateNode) {
            return !stateNode.history;
          })
        };
      };
      /**
       * Resolves to the historical value(s) of the parent state node,
       * represented by state nodes.
       *
       * @param historyValue
       */


      StateNode.prototype.resolveHistory = function (historyValue) {
        var _this = this;

        if (this.type !== 'history') {
          return [this];
        }

        var parent = this.parent;

        if (!historyValue) {
          var historyTarget = this.target;
          return historyTarget ? flatten(toStatePaths(historyTarget).map(function (relativeChildPath) {
            return parent.getFromRelativePath(relativeChildPath);
          })) : parent.initialStateNodes;
        }

        var subHistoryValue = nestedPath(parent.path, 'states')(historyValue).current;

        if (isString$1(subHistoryValue)) {
          return [parent.getStateNode(subHistoryValue)];
        }

        return flatten(toStatePaths(subHistoryValue).map(function (subStatePath) {
          return _this.history === 'deep' ? parent.getFromRelativePath(subStatePath) : [parent.states[subStatePath[0]]];
        }));
      };

      Object.defineProperty(StateNode.prototype, "stateIds", {
        /**
         * All the state node IDs of this state node and its descendant state nodes.
         */
        get: function () {
          var _this = this;

          var childStateIds = flatten(Object.keys(this.states).map(function (stateKey) {
            return _this.states[stateKey].stateIds;
          }));
          return [this.id].concat(childStateIds);
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(StateNode.prototype, "events", {
        /**
         * All the event types accepted by this state node and its descendants.
         */
        get: function () {
          var e_7, _a, e_8, _b;

          if (this.__cache.events) {
            return this.__cache.events;
          }

          var states = this.states;
          var events = new Set(this.ownEvents);

          if (states) {
            try {
              for (var _c = __values$1(Object.keys(states)), _d = _c.next(); !_d.done; _d = _c.next()) {
                var stateId = _d.value;
                var state = states[stateId];

                if (state.states) {
                  try {
                    for (var _e = (e_8 = void 0, __values$1(state.events)), _f = _e.next(); !_f.done; _f = _e.next()) {
                      var event_1 = _f.value;
                      events.add("".concat(event_1));
                    }
                  } catch (e_8_1) {
                    e_8 = {
                      error: e_8_1
                    };
                  } finally {
                    try {
                      if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                    } finally {
                      if (e_8) throw e_8.error;
                    }
                  }
                }
              }
            } catch (e_7_1) {
              e_7 = {
                error: e_7_1
              };
            } finally {
              try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
              } finally {
                if (e_7) throw e_7.error;
              }
            }
          }

          return this.__cache.events = Array.from(events);
        },
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(StateNode.prototype, "ownEvents", {
        /**
         * All the events that have transitions directly from this state node.
         *
         * Excludes any inert events.
         */
        get: function () {
          var events = new Set(this.transitions.filter(function (transition) {
            return !(!transition.target && !transition.actions.length && transition.internal);
          }).map(function (transition) {
            return transition.eventType;
          }));
          return Array.from(events);
        },
        enumerable: false,
        configurable: true
      });

      StateNode.prototype.resolveTarget = function (_target) {
        var _this = this;

        if (_target === undefined) {
          // an undefined target signals that the state node should not transition from that state when receiving that event
          return undefined;
        }

        return _target.map(function (target) {
          if (!isString$1(target)) {
            return target;
          }

          var isInternalTarget = target[0] === _this.delimiter; // If internal target is defined on machine,
          // do not include machine key on target

          if (isInternalTarget && !_this.parent) {
            return _this.getStateNodeByPath(target.slice(1));
          }

          var resolvedTarget = isInternalTarget ? _this.key + target : target;

          if (_this.parent) {
            try {
              var targetStateNode = _this.parent.getStateNodeByPath(resolvedTarget);

              return targetStateNode;
            } catch (err) {
              throw new Error("Invalid transition definition for state node '".concat(_this.id, "':\n").concat(err.message));
            }
          } else {
            return _this.getStateNodeByPath(resolvedTarget);
          }
        });
      };

      StateNode.prototype.formatTransition = function (transitionConfig) {
        var _this = this;

        var normalizedTarget = normalizeTarget(transitionConfig.target);
        var internal = 'internal' in transitionConfig ? transitionConfig.internal : normalizedTarget ? normalizedTarget.some(function (_target) {
          return isString$1(_target) && _target[0] === _this.delimiter;
        }) : true;
        var guards = this.machine.options.guards;
        var target = this.resolveTarget(normalizedTarget);

        var transition = __assign$1(__assign$1({}, transitionConfig), {
          actions: toActionObjects(toArray(transitionConfig.actions)),
          cond: toGuard(transitionConfig.cond, guards),
          target: target,
          source: this,
          internal: internal,
          eventType: transitionConfig.event,
          toJSON: function () {
            return __assign$1(__assign$1({}, transition), {
              target: transition.target ? transition.target.map(function (t) {
                return "#".concat(t.id);
              }) : undefined,
              source: "#".concat(_this.id)
            });
          }
        });

        return transition;
      };

      StateNode.prototype.formatTransitions = function () {
        var e_9, _a;

        var _this = this;

        var onConfig;

        if (!this.config.on) {
          onConfig = [];
        } else if (Array.isArray(this.config.on)) {
          onConfig = this.config.on;
        } else {
          var _b = this.config.on,
              _c = WILDCARD,
              _d = _b[_c],
              wildcardConfigs = _d === void 0 ? [] : _d,
              strictTransitionConfigs_1 = __rest(_b, [typeof _c === "symbol" ? _c : _c + ""]);

          onConfig = flatten(Object.keys(strictTransitionConfigs_1).map(function (key) {
            if (key === NULL_EVENT) {
              warn(false, "Empty string transition configs (e.g., `{ on: { '': ... }}`) for transient transitions are deprecated. Specify the transition in the `{ always: ... }` property instead. " + "Please check the `on` configuration for \"#".concat(_this.id, "\"."));
            }

            var transitionConfigArray = toTransitionConfigArray(key, strictTransitionConfigs_1[key]);

            {
              validateArrayifiedTransitions(_this, key, transitionConfigArray);
            }

            return transitionConfigArray;
          }).concat(toTransitionConfigArray(WILDCARD, wildcardConfigs)));
        }

        var eventlessConfig = this.config.always ? toTransitionConfigArray('', this.config.always) : [];
        var doneConfig = this.config.onDone ? toTransitionConfigArray(String(done(this.id)), this.config.onDone) : [];

        {
          warn(!(this.config.onDone && !this.parent), "Root nodes cannot have an \".onDone\" transition. Please check the config of \"".concat(this.id, "\"."));
        }

        var invokeConfig = flatten(this.invoke.map(function (invokeDef) {
          var settleTransitions = [];

          if (invokeDef.onDone) {
            settleTransitions.push.apply(settleTransitions, __spreadArray([], __read(toTransitionConfigArray(String(doneInvoke(invokeDef.id)), invokeDef.onDone)), false));
          }

          if (invokeDef.onError) {
            settleTransitions.push.apply(settleTransitions, __spreadArray([], __read(toTransitionConfigArray(String(error$1(invokeDef.id)), invokeDef.onError)), false));
          }

          return settleTransitions;
        }));
        var delayedTransitions = this.after;
        var formattedTransitions = flatten(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], __read(doneConfig), false), __read(invokeConfig), false), __read(onConfig), false), __read(eventlessConfig), false).map(function (transitionConfig) {
          return toArray(transitionConfig).map(function (transition) {
            return _this.formatTransition(transition);
          });
        }));

        try {
          for (var delayedTransitions_1 = __values$1(delayedTransitions), delayedTransitions_1_1 = delayedTransitions_1.next(); !delayedTransitions_1_1.done; delayedTransitions_1_1 = delayedTransitions_1.next()) {
            var delayedTransition = delayedTransitions_1_1.value;
            formattedTransitions.push(delayedTransition);
          }
        } catch (e_9_1) {
          e_9 = {
            error: e_9_1
          };
        } finally {
          try {
            if (delayedTransitions_1_1 && !delayedTransitions_1_1.done && (_a = delayedTransitions_1.return)) _a.call(delayedTransitions_1);
          } finally {
            if (e_9) throw e_9.error;
          }
        }

        return formattedTransitions;
      };

      return StateNode;
    }();

    function createMachine(config, options) {
      return new StateNode(config, options);
    }

    var assign$1 = assign$2,
        sendParent$1 = sendParent$2;

    const creativeList2 = [
        {
            "video": {
                "vast": {
                    "width": 16,
                    "height": 9,
                    "vastXml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<VAST xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:noNamespaceSchemaLocation=\"vast.xsd\" version=\"3.0\">\n    <Ad id=\"324471\">\n        <InLine>\n            <AdSystem>Persona.ly RTB</AdSystem>\n            <AdTitle>FR - Paypal (AOS)</AdTitle>\n            <Error><![CDATA[https://us-event.app-install.bid/rtb/error?id=YnRyAgMAAAF1jOZYFgAE83cAAAAmw7SHF0YLQaS9PsPwmRk5hgACdXMB&code=[ERRORCODE]]]></Error>\n            <Impression><![CDATA[https://us-event.app-install.bid/rtb/impr?id=YnRyAgMAAAF1jOZYFgAE83cAAAAmw7SHF0YLQaS9PsPwmRk5hgACdXMB&price=${AUCTION_PRICE}]]></Impression>\n            <Creatives>\n                <Creative>\n                    <Linear>\n                        <Duration>00:00:08</Duration>\n                        <TrackingEvents>\n                            <Tracking event=\"start\"><![CDATA[https://us-event.app-install.bid/rtb/event/start?id=YnRyAgMAAAF1jOZYFgAE83cAAAAmw7SHF0YLQaS9PsPwmRk5hgACdXMB&price=${AUCTION_PRICE}]]></Tracking>\n                            <Tracking event=\"firstQuartile\"><![CDATA[https://us-event.app-install.bid/rtb/event/firstQuartile?id=YnRyAgMAAAF1jOZYFgAE83cAAAAmw7SHF0YLQaS9PsPwmRk5hgACdXMB]]></Tracking>\n                            <Tracking event=\"midpoint\"><![CDATA[https://us-event.app-install.bid/rtb/event/midpoint?id=YnRyAgMAAAF1jOZYFgAE83cAAAAmw7SHF0YLQaS9PsPwmRk5hgACdXMB]]></Tracking>\n                            <Tracking event=\"thirdQuartile\"><![CDATA[https://us-event.app-install.bid/rtb/event/thirdQuartile?id=YnRyAgMAAAF1jOZYFgAE83cAAAAmw7SHF0YLQaS9PsPwmRk5hgACdXMB]]></Tracking>\n                            <Tracking event=\"complete\"><![CDATA[https://us-event.app-install.bid/rtb/event/complete?id=YnRyAgMAAAF1jOZYFgAE83cAAAAmw7SHF0YLQaS9PsPwmRk5hgACdXMB]]></Tracking>\n                            <Tracking event=\"skip\"><![CDATA[https://us-event.app-install.bid/rtb/event/skip?id=YnRyAgMAAAF1jOZYFgAE83cAAAAmw7SHF0YLQaS9PsPwmRk5hgACdXMB]]></Tracking>\n                        </TrackingEvents>\n                        <VideoClicks>\n                            <ClickThrough><![CDATA[https://us-event.app-install.bid/rtb/click?id=YnRyAgMAAAF1jOZYFgAE83cAAAAmw7SHF0YLQaS9PsPwmRk5hgACdXMB]]></ClickThrough>\n                        </VideoClicks>\n                        <MediaFiles>\n                            <MediaFile delivery=\"progressive\" type=\"video/mp4\" width=\"720\" height=\"1280\"><![CDATA[https://content.cdn.personaly.bid/ui_creatives/flashrewards_paypal/video/FR_paypal_scroll_up_school.mp4]]></MediaFile>\n                        </MediaFiles>\n                    </Linear>\n                </Creative>\n                <Creative>\n                    <CompanionAds>\n                        <Companion id=\"endCard\" width=\"800\" height=\"1280\">\n                            <HTMLResource><![CDATA[<script src=\"mraid.js\"></script><meta charset=\"UTF-8\"><meta name=\"mobile-web-app-capable\" content=\"yes\"><meta name=\"apple-mobile-web-app-capable\" content=\"yes\"><meta name=\"viewport\" content=\"initial-scale=1,maximum-scale=1,user-scalable=0,viewport-fit=cover,minimal-ui\" /><link href=\"https://creatives.crossinstall.com/kolib_idlem_e3/8dfa08b6a7a3fb99a8000000/css/mraid_wrapper.min.css\" rel=\"stylesheet\" /><script type=\"text/javascript\">  var ad_name = \"kolib_idlem_e3\";  var ad_title = \"Idle Miner Tycoon\";  var ad_hash = \"/8dfa08b6a7a3fb99a8000000\";  var ad_orientation = \"landscape\"; var ad_orientation_style = \"none\";  var ad_vta_urls = \"{}\";  var ad_webroot = \"https://creatives.crossinstall.com\";  var ad_logroot = \"https://www.serveroute.com\";  var ad_splash_image = ad_webroot + \"/kolib_idlem_e3/8dfa08b6a7a3fb99a8000000/img/icon.jpg\";  var ad_has_custom_load_screen = false;  var ad_creative_id = \"ci_MoPub-2021-01-25-en-15s-16x9-MoPubTestSuccessful-HighResolution_PEC.mp4\";  var ad_close_duration = 30000;  var ad_close_position = \"none\";  var cta_close_position = \"none\";  var ad_close_countdown = false;  var ad_hide_header = false;  var ad_exchange = \"inmobi\";  var ad_dynamic_parameters = \"cta_btn_text=Download Now!&sound_icon=false&cta_on_idle_time=23750&tutorial=false&cta_scrn_clickable=false&cta_btn_persistent=false&initial_filling=90&sound=true\";  var ad_advertising_label_lang = \"\";  var ad_show_age_ratings = \"\";  var ad_tracking_pixels = [];  var ad_analytics_sample_rate = 5.0;  var ad_auction_id = \"95d98fd2eb28f4c322c2e699899ff48c\";  var ad_device_id = \"B3F960B2-321E-460F-9DC8-9DF3AE672CF0\";  var ad_time_series = \"YXBwQm9vc3Q9MS4wJnNicj10cnVlJnByPWZhbHNlJnBzPTAuMjcmcmV2dD1jb20mY3VyYz1BcnRzKyUyNitFbnRlcnRhaW5tZW50JTJDSG9iYmllcyslMjYrSW50ZXJlc3RzJTJDVmlkZW8rJTI2K0NvbXB1dGVyK0dhbWVzJmZubGM9MSZjY3A9Tk9ORSZ2aWU9Tk9ORSZleGk9MTExMjMmZXhuPWNhc3VhbC1pb3MrLSUzRStjb252Ky0rMjAyMTA3MjEuMTYzMCZjdHI9Tk9ORSZleHM9ZXhwZXJpbWVudCZhZD0xJmRldmljZV9pZD1CM0Y5NjBCMi0zMjFFLTQ2MEYtOURDOC05REYzQUU2NzJDRjAmY29udHJvbGxlclR5cGU9ZXYmYWk9ODM5MDU0MiZpbnN0YWxsQ2x1c3RlcktvekNvczUwMD0zODklMkM0NTMmc2thblByZXNlbnQ9dHJ1ZSZhbj10ZXN0X2FjY291bnQmZXhwZXJpbWVudEJvb3N0PTEuMCZhcj11cy1lYXN0LTEmcmQ9NDgweDI3MCZhcz1ZRVMmcmU9Q0EmYXQ9R1JBRCZwaXhlbERlbnNpdHk9Tk9ORSZyZj1WSURFTyZhZHZpPTU5NSZjcmVhdGl2ZV9wcm9kdWNlZGJ5PVVOS05PV04mY2xpY2tUeXBlPXMycyZiYj0wLjAyJnJyPTAuMDAyMDUzMTI1MzU0NzA4ODU3JmJjPUlBQjExJTJDSUFCMTEtMiUyQ0lBQjExLTQlMkNJQUIxNC0xJTJDSUFCMTQtMiUyQ0lBQjE0LTMlMkNJQUIxNC00JTJDSUFCMTQtNiUyQ0lBQjE0LTclMkNJQUIxNS0xJTJDSUFCMTUtNSUyQ0lBQjE2LTclMkNJQUIxNy0xOCUyQ0lBQjE3LTIwJTJDSUFCMTgtMSUyQ0lBQjE4LTIlMkNJQUIxOS0zJTJDSUFCMTktMzAlMkNJQUIyMi0xJTJDSUFCMjMtMSUyQ0lBQjIzLTEwJTJDSUFCMjMtMiUyQ0lBQjIzLTMlMkNJQUIyMy00JTJDSUFCMjMtNSUyQ0lBQjIzLTYlMkNJQUIyMy03JTJDSUFCMjMtOCUyQ0lBQjIzLTklMkNJQUIyNCUyQ0lBQjI1LTElMkNJQUIyNS0yJTJDSUFCMjUtMyUyQ0lBQjI1LTQlMkNJQUIyNS01JTJDSUFCMjUtNiUyQ0lBQjI2JTJDSUFCMjYtMiUyQ0lBQjI2LTMlMkNJQUIyNi00JTJDSUFCMy0zJTJDSUFCMy03JTJDSUFCNS0yJTJDSUFCNi0xJTJDSUFCNy0xMCUyQ0lBQjctMTElMkNJQUI3LTEyJTJDSUFCNy0xMyUyQ0lBQjctMTQlMkNJQUI3LTE5JTJDSUFCNy0yJTJDSUFCNy0yMSUyQ0lBQjctMjIlMkNJQUI3LTI0JTJDSUFCNy0yOSUyQ0lBQjctMyUyQ0lBQjctMzAlMkNJQUI3LTMxJTJDSUFCNy0zNCUyQ0lBQjctMzclMkNJQUI3LTM5JTJDSUFCNy00MSUyQ0lBQjctNDIlMkNJQUI3LTQ0JTJDSUFCNy00NSUyQ0lBQjctOSUyQ0lBQjgtMTglMkNJQUI4LTUlMkNJQUI5LTkmc2thbl9jYW1wYWlnbl9pZD0yMSZydD0wLjAxOSZkZXZpY2VJZFR5cGU9SURGQSZiZj0zLjczJnJ2PXRydWUmYmk9MTAuMC43Ljg2JmFhaT0xMDYwNjkxNTEzJmJsPWZhbHNlJnBhdWNzPUJVQ0tFVDAwMCZicD0yMDAuMCZzYj05NiZzYz0wLjAyODE4MDUxNjEwNDU5MzUzNCZ1aWQ9bDg0M3E4TlNWVUglMkJHQW1OU1IwU0hwJTJGRG5FNCUzRCZhcmE9ZmFsc2Umc2U9JTVCNTAtMTAwJTI5JmJ0PWNwbSZhZG9tYWluPXRlc3QuY29tJnNpPTE0MzQ5NjQmcHVibGlzaGVyQ2FtcGFpZ25Cb29zdD0xLjAmY2E9MTQ5NDY0ODcxNCZjYj1tZWRpdW0mc3M9Q1JTJTNBUk5EX0NQUyUzQUFMX0YlM0ExODAwX0xDJTNBNTAmYnRzPTIwMjEuMDguMDktMTYuMzQmYT12ZXJ5aGlnaCZzdD1VTktOT1dOJmNlPUJfREVGQVVMVCZhcnQ9Tk9ORSZzZXQ9MTA2MDY5MTUxMy5jbGlja2VycyUyQzEyMzQ1Njc4OS5jbGlja2VycyUyQzE0NDM0NDYxNzQuaW5zdGFsbGVkJTJDNzE0NTA4MjI0Lmluc3RhbGxlZCUyQzkxNjg2OTM5NS5pbnN0YWxsZWQlMkNjcm9zc2luc3RhbGwuY3JlYXRpdmUuMC5pbnRlcmFjdGVkJTJDY3Jvc3NpbnN0YWxsLmNyZWF0aXZlLjEwNjA2OTE1MTMuaW50ZXJhY3RlZCUyQ2Nyb3NzaW5zdGFsbC5jcmVhdGl2ZS4xMjM0NTY3ODkuaW50ZXJhY3RlZCZjPUNvbWNhc3QrV2lGaSZkPTIwMjEwODEwJnN6PTQ4MHgzMjAmZz1Vbmtub3duJmNvPXdpZmkmbD1lbiZjcD0xLjAmY3I9Y2lfTW9QdWItMjAyMS0wMS0yNS1lbi0xNXMtMTZ4OS1Nb1B1YlRlc3RTdWNjZXNzZnVsLUhpZ2hSZXNvbHV0aW9uX1BFQy5tcDQmY3M9V0lGSSZwcmVkaWN0ZWRQcmljZT0wLjAmY3g9aW5tb2JpJmRhPSU1QjYwZGF5LTkwZGF5JTVEJnR0PTIwMjEwNzIxLjE2MzAmdHJhY2tpbmdBdXRoU3RhdHVzPUFVVEhPUklaRUQmYWNpPWhEcWsmZGw9bm9uZSZkbT1pUGhvbmUmZG49SUVDK0dsb2JhbCZkcD1jdGFfYnRuX3BlcnNpc3RlbnQlM0FmYWxzZSUyQ2luaXRpYWxfZmlsbGluZyUzQTkwJTJDY3RhX2J0bl90ZXh0JTNBRG93bmxvYWQrTm93JTIxJTJDY3RhX3Njcm5fY2xpY2thYmxlJTNBZmFsc2UlMkNzb3VuZCUzQXRydWUlMkNzb3VuZF9pY29uJTNBZmFsc2UlMkNjdGFfb25faWRsZV90aW1lJTNBMjM3NTAlMkN0dXRvcmlhbCUzQWZhbHNlJnByYXBiPTAuOSZ1aD0wMCZjYW1wYWlnbkdyb3VwVHlwZT1CJTNBK0ZST01fMTRfNV9XSVRIX0lERkFfV0lUSF9TS0FOJnBvc3M9NDgweDMyMCZiaWRfaWQ9MmQ1YzVkYTMtMDE3Yi0xMDAwLWQzZjMtOTU2Y2FiZjIwMDMzJnZlPSZjcGlfZ29hbD0xLjAmdmk9dHJ1ZSZjb250ZW50UmF0aW5nPSZwYXBwcz1CVUNLRVQwMDAmdnI9dHJ1ZSZjaWM9bnVsbCZ2cz10cnVlJmZlPW5vbmUmdnY9VkFTVCszLjAmYXV0PUZJUlNUX1BSSUNFJnRhZ0lkPSZmbz0xNC42JnBjaT1sY2p3JnBjbj1TY2FybGV0dCtUZXN0K0NhbXBhaWduKy0raU9TX3R5cGVfQistK0dyYWRzJnBjcD1OT05FJnRsZD1uZXQmcHJlZGljdGVkUHJpY2VUaWVyPUVJR0hUWV9ET0xMQVJfVElFUiZhZEJvb3N0PTEuMCZoYj1mYWxzZSZhZ2U9VW5rbm93biZwZWNTdXBwb3J0PXRydWUmbW9wdWJfdWFfY3JlYXRpdmVfaWQ9JmRtdj1pUGhvbmUrMTErUHJvK01heCZpbXBfaWQ9MSZhZEFwcElkPTEwNjA2OTE1MTMmb3N2PTE0JmlhPXllcyZ6aXA9OTQzMDEmdmFuZ3VhcmRPcGFjaXR5PTAuMCZpbD1ub25lJmluPWZhbHNlJmN1cnJhcHBWZXJzaW9uPTcuMC4wJnVwZD0wMC0wNiZkbnQ9ZmFsc2UmaXQ9cjQuOHhsYXJnZSZwdWJsaXNoZXJDYW1wYWlnblJ1bGVzQm9vc3Q9MS4wJnppPWZhbHNlJnVwdz13ZWVrZGF5JnBjcnQ9MjAyMS0wNy0wNisxNiUzQTA0JmJsb2NrZWRBZ2VSYXRpbmc9TUFYJnZhbmd1YXJkUmVxdWVzdHM9MS4wJnBjcmE9ZmFsc2UmZXhjaGFuZ2VfYm9vc3Q9MS4wJmxwZD0xMi0xOCZ2Y3I9Tk9ORSZ0cGE9QWRqdXN0JmNudD1VU0EmdXNlclJhdGluZz0mc2tBZE5ldHdvcmtJZENhc2luZz1MT1dFUiZscHc9d2Vla2RheSZiYWdlPU1BWCZnZHByYT1mYWxzZSZsaD0xNyZhZHZlcnRpc2VyQ2FtcGFpZ25Cb29zdD0xLjAmbG89TEFORFNDQVBFJmVjaT1rb2xpYl9pZGxlbV9lMyZmZWk9MCZkYWk9MTAzMTI1MyZkYXA9JTVCMGRheS0xZGF5JTVEJnNlbGVjdGVkUHJpY2VDYXA9MTAwMDAuMCZtYz00NCZwYXBiPTEuMCZlY3Y9OGRmYTA4YjZhN2EzZmI5OWE4MDAwMDAwJm1pPWZhbHNlJmNwc3Q9Tk9ORSZtbj1jYXN1YWwtaW9zLmNvbnZfdnNfY2FzdWFsLWlvcy5pbXAua29rbyZjcHA9ZmFsc2UmbXI9bm8mcndkcj10cnVlJm11PWZhbHNlJm52cD0lNUIxJTVEJmNyZWF0aXZlQWJUZXN0PWZhbHNlJm5hPW1lZGl1bSZuZD1mYWxzZSZkc209bm9uZSZsc2g9MTQlMkMxNSUyQzE2JTJDMTclMkMxOCUyQzE5JTJDMjAmYXBwbGllZFByaWNlQ2FwPWZhbHNlJm50PWZhbHNlJmRzdj0wLjAuMCZudj0lNUIyNS01MCUyOSZ1ZHc9VHVlJmFjcnQ9Tk9ORSZhZHZlcnRpc2VyQ2FtcGFpZ25SdWxlc0Jvb3N0PTEuMCZhcHBSdWxlc0Jvb3N0PTEuMCZvYj0wLjkuMTQmYnBiPSU1Qjc5LjUrdG8rJTJCaW5mJTVEJmFkQXBwQWdlUmF0aW5nPVNFVkVOVEVFTl9QTFVTJnRzdj0lNUI3ZGF5LWluZiU1RCZjYXQ9QXJ0cyslMjYrRW50ZXJ0YWlubWVudCUyQ0hvYmJpZXMrJTI2K0ludGVyZXN0cyUyQ1ZpZGVvKyUyNitDb21wdXRlcitHYW1lcyZtYWtlPUFwcGxlJmxjdT0yMDIxLTA4LTA5KzE2JTNBNDMlM0EwMyZvcj1mYWxzZSZwbGE9bm8mY3JpZD1jaV9Nb1B1Yi0yMDIxLTAxLTI1LWVuLTE1cy0xNng5LU1vUHViVGVzdFN1Y2Nlc3NmdWwtSGlnaFJlc29sdXRpb25fUEVDLm1wNCZvcz1pb3Mmc2thZG5ldHdvcmtWZXJzaW9uPTIuMCZlbmRjYXJkRm9ybWF0PVBMQVlBQkxFJTJDcGxheWFibGUmcGI9MC45MDAwJmZyZXFfYm9vc3Q9bnVsbCZhZHZlcnRpc2VyQm9vc3Q9MS4wJnVzUHJpdmFjeUFwcGxpZXM9ZmFsc2UmYWNyYT1mYWxzZSZnbG9iYWxCb29zdD0wLjI3JnBuPUJhbGwrU29ydCtQdXp6bGUmbGR3PU1vbiZyZXF1ZXN0R3JvdXBUeXBlPUIlM0ErRlJPTV8xNF81X1dJVEhfSURGQV9XSVRIX1NLQU4%3D\";  var ad_click_dest = \"https://step-service.crossinstall.io/skan/click?ad=lcjw&sub=8390542&sub2=2d5c5da3-017b-1000-d3f3-956cabf20033&sub3=1&sub4=1434964&sub10=inmobi&idfa=B3F960B2-321E-460F-9DC8-9DF3AE672CF0&sub9=ci_MoPub-2021-01-25-en-15s-16x9-MoPubTestSuccessful-HighResolution_PEC.mp4&publisher=1494648714&size=480x320&genre=&p=YXM6NDgweDMyMHxhZzowfGdlOjB8Y2I6MnxuYToyfGFsOjR8Y3Q6MnxwYTo1fHBtOjF8cGw6Mg%253D%253D&ctry=US&v=&fei=0&skcid=21&clkT=s2s&impts=1628553633&sub11=[ts]\";  ad_click_dest = ad_click_dest.replace('[ts]', ad_time_series);  var ad_geo_city = \"SAN JOSE\";  var ad_geo_country = \"US\";  var ad_leadin = \"\";  var ad_fonts_to_load = \"spartan\";  if(ad_exchange === \"chartboost\") ad_orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';</script><script type='text/javascript' crossorigin='anonymous' src='https://creatives.crossinstall.com/kolib_idlem_e3/8dfa08b6a7a3fb99a8000000/js/code.js'></script><div id=\"creative\"></div>]]></HTMLResource>\n                            <TrackingEvents>\n                                <Tracking event=\"creativeView\"><![CDATA[https://us-event.app-install.bid/rtb/event/companion?id=YnRyAgMAAAF1jOZYFgAE83cAAAAmw7SHF0YLQaS9PsPwmRk5hgACdXMB]]></Tracking>\n                            </TrackingEvents>\n                            <CompanionClickThrough><![CDATA[https://us-event.app-install.bid/rtb/click?id=YnRyAgMAAAF1jOZYFgAE83cAAAAmw7SHF0YLQaS9PsPwmRk5hgACdXMB&companion=true]]></CompanionClickThrough>\n                        </Companion>\n                    </CompanionAds>\n                </Creative>\n            </Creatives>\n        </InLine>\n    </Ad>\n</VAST>\n",
                    "version": "2.0"
                }
            },
            "vastVideoOrientation": "landscape",
            "videoExperience": 1,
            "rvExpEnabled": true,
            "rvExpScale": 50.5,
            "omidEnabled": true
        },
        {
            "video": {
                "vast": {
                    "width": 16,
                    "height": 9,
                    "vastXml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<VAST xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:noNamespaceSchemaLocation=\"vast.xsd\" version=\"3.0\">\n    <Ad id=\"324471\">\n        <InLine>\n            <AdSystem>Persona.ly RTB</AdSystem>\n            <AdTitle>FR - Paypal (AOS)</AdTitle>\n            <Error><![CDATA[https://us-event.app-install.bid/rtb/error?id=YnRyAgMAAAF1jOZYFgAE83cAAAAmw7SHF0YLQaS9PsPwmRk5hgACdXMB&code=[ERRORCODE]]]></Error>\n            <Impression><![CDATA[https://us-event.app-install.bid/rtb/impr?id=YnRyAgMAAAF1jOZYFgAE83cAAAAmw7SHF0YLQaS9PsPwmRk5hgACdXMB&price=${AUCTION_PRICE}]]></Impression>\n            <Creatives>\n                <Creative>\n                    <Linear>\n                        <Duration>00:00:08</Duration>\n                        <TrackingEvents>\n                            <Tracking event=\"start\"><![CDATA[https://us-event.app-install.bid/rtb/event/start?id=YnRyAgMAAAF1jOZYFgAE83cAAAAmw7SHF0YLQaS9PsPwmRk5hgACdXMB&price=${AUCTION_PRICE}]]></Tracking>\n                            <Tracking event=\"firstQuartile\"><![CDATA[https://us-event.app-install.bid/rtb/event/firstQuartile?id=YnRyAgMAAAF1jOZYFgAE83cAAAAmw7SHF0YLQaS9PsPwmRk5hgACdXMB]]></Tracking>\n                            <Tracking event=\"midpoint\"><![CDATA[https://us-event.app-install.bid/rtb/event/midpoint?id=YnRyAgMAAAF1jOZYFgAE83cAAAAmw7SHF0YLQaS9PsPwmRk5hgACdXMB]]></Tracking>\n                            <Tracking event=\"thirdQuartile\"><![CDATA[https://us-event.app-install.bid/rtb/event/thirdQuartile?id=YnRyAgMAAAF1jOZYFgAE83cAAAAmw7SHF0YLQaS9PsPwmRk5hgACdXMB]]></Tracking>\n                            <Tracking event=\"complete\"><![CDATA[https://us-event.app-install.bid/rtb/event/complete?id=YnRyAgMAAAF1jOZYFgAE83cAAAAmw7SHF0YLQaS9PsPwmRk5hgACdXMB]]></Tracking>\n                            <Tracking event=\"skip\"><![CDATA[https://us-event.app-install.bid/rtb/event/skip?id=YnRyAgMAAAF1jOZYFgAE83cAAAAmw7SHF0YLQaS9PsPwmRk5hgACdXMB]]></Tracking>\n                        </TrackingEvents>\n                        <VideoClicks>\n                            <ClickThrough><![CDATA[https://us-event.app-install.bid/rtb/click?id=YnRyAgMAAAF1jOZYFgAE83cAAAAmw7SHF0YLQaS9PsPwmRk5hgACdXMB]]></ClickThrough>\n                        </VideoClicks>\n                        <MediaFiles>\n                            <MediaFile delivery=\"progressive\" type=\"video/mp4\" width=\"720\" height=\"1280\"><![CDATA[https://content.cdn.personaly.bid/ui_creatives/flashrewards_paypal/video/FR_paypal_scroll_up_school.mp4]]></MediaFile>\n                        </MediaFiles>\n                    </Linear>\n                </Creative>\n                <Creative>\n                    <CompanionAds>\n                        <Companion id=\"endCard\" width=\"800\" height=\"1280\">\n                            <HTMLResource><![CDATA[<script src=\"mraid.js\"></script><meta charset=\"UTF-8\"><meta name=\"mobile-web-app-capable\" content=\"yes\"><meta name=\"apple-mobile-web-app-capable\" content=\"yes\"><meta name=\"viewport\" content=\"initial-scale=1,maximum-scale=1,user-scalable=0,viewport-fit=cover,minimal-ui\" /><link href=\"https://creatives.crossinstall.com/kolib_idlem_e3/8dfa08b6a7a3fb99a8000000/css/mraid_wrapper.min.css\" rel=\"stylesheet\" /><script type=\"text/javascript\">  var ad_name = \"kolib_idlem_e3\";  var ad_title = \"Idle Miner Tycoon\";  var ad_hash = \"/8dfa08b6a7a3fb99a8000000\";  var ad_orientation = \"landscape\"; var ad_orientation_style = \"none\";  var ad_vta_urls = \"{}\";  var ad_webroot = \"https://creatives.crossinstall.com\";  var ad_logroot = \"https://www.serveroute.com\";  var ad_splash_image = ad_webroot + \"/kolib_idlem_e3/8dfa08b6a7a3fb99a8000000/img/icon.jpg\";  var ad_has_custom_load_screen = false;  var ad_creative_id = \"ci_MoPub-2021-01-25-en-15s-16x9-MoPubTestSuccessful-HighResolution_PEC.mp4\";  var ad_close_duration = 30000;  var ad_close_position = \"none\";  var cta_close_position = \"none\";  var ad_close_countdown = false;  var ad_hide_header = false;  var ad_exchange = \"inmobi\";  var ad_dynamic_parameters = \"cta_btn_text=Download Now!&sound_icon=false&cta_on_idle_time=23750&tutorial=false&cta_scrn_clickable=false&cta_btn_persistent=false&initial_filling=90&sound=true\";  var ad_advertising_label_lang = \"\";  var ad_show_age_ratings = \"\";  var ad_tracking_pixels = [];  var ad_analytics_sample_rate = 5.0;  var ad_auction_id = \"95d98fd2eb28f4c322c2e699899ff48c\";  var ad_device_id = \"B3F960B2-321E-460F-9DC8-9DF3AE672CF0\";  var ad_time_series = \"YXBwQm9vc3Q9MS4wJnNicj10cnVlJnByPWZhbHNlJnBzPTAuMjcmcmV2dD1jb20mY3VyYz1BcnRzKyUyNitFbnRlcnRhaW5tZW50JTJDSG9iYmllcyslMjYrSW50ZXJlc3RzJTJDVmlkZW8rJTI2K0NvbXB1dGVyK0dhbWVzJmZubGM9MSZjY3A9Tk9ORSZ2aWU9Tk9ORSZleGk9MTExMjMmZXhuPWNhc3VhbC1pb3MrLSUzRStjb252Ky0rMjAyMTA3MjEuMTYzMCZjdHI9Tk9ORSZleHM9ZXhwZXJpbWVudCZhZD0xJmRldmljZV9pZD1CM0Y5NjBCMi0zMjFFLTQ2MEYtOURDOC05REYzQUU2NzJDRjAmY29udHJvbGxlclR5cGU9ZXYmYWk9ODM5MDU0MiZpbnN0YWxsQ2x1c3RlcktvekNvczUwMD0zODklMkM0NTMmc2thblByZXNlbnQ9dHJ1ZSZhbj10ZXN0X2FjY291bnQmZXhwZXJpbWVudEJvb3N0PTEuMCZhcj11cy1lYXN0LTEmcmQ9NDgweDI3MCZhcz1ZRVMmcmU9Q0EmYXQ9R1JBRCZwaXhlbERlbnNpdHk9Tk9ORSZyZj1WSURFTyZhZHZpPTU5NSZjcmVhdGl2ZV9wcm9kdWNlZGJ5PVVOS05PV04mY2xpY2tUeXBlPXMycyZiYj0wLjAyJnJyPTAuMDAyMDUzMTI1MzU0NzA4ODU3JmJjPUlBQjExJTJDSUFCMTEtMiUyQ0lBQjExLTQlMkNJQUIxNC0xJTJDSUFCMTQtMiUyQ0lBQjE0LTMlMkNJQUIxNC00JTJDSUFCMTQtNiUyQ0lBQjE0LTclMkNJQUIxNS0xJTJDSUFCMTUtNSUyQ0lBQjE2LTclMkNJQUIxNy0xOCUyQ0lBQjE3LTIwJTJDSUFCMTgtMSUyQ0lBQjE4LTIlMkNJQUIxOS0zJTJDSUFCMTktMzAlMkNJQUIyMi0xJTJDSUFCMjMtMSUyQ0lBQjIzLTEwJTJDSUFCMjMtMiUyQ0lBQjIzLTMlMkNJQUIyMy00JTJDSUFCMjMtNSUyQ0lBQjIzLTYlMkNJQUIyMy03JTJDSUFCMjMtOCUyQ0lBQjIzLTklMkNJQUIyNCUyQ0lBQjI1LTElMkNJQUIyNS0yJTJDSUFCMjUtMyUyQ0lBQjI1LTQlMkNJQUIyNS01JTJDSUFCMjUtNiUyQ0lBQjI2JTJDSUFCMjYtMiUyQ0lBQjI2LTMlMkNJQUIyNi00JTJDSUFCMy0zJTJDSUFCMy03JTJDSUFCNS0yJTJDSUFCNi0xJTJDSUFCNy0xMCUyQ0lBQjctMTElMkNJQUI3LTEyJTJDSUFCNy0xMyUyQ0lBQjctMTQlMkNJQUI3LTE5JTJDSUFCNy0yJTJDSUFCNy0yMSUyQ0lBQjctMjIlMkNJQUI3LTI0JTJDSUFCNy0yOSUyQ0lBQjctMyUyQ0lBQjctMzAlMkNJQUI3LTMxJTJDSUFCNy0zNCUyQ0lBQjctMzclMkNJQUI3LTM5JTJDSUFCNy00MSUyQ0lBQjctNDIlMkNJQUI3LTQ0JTJDSUFCNy00NSUyQ0lBQjctOSUyQ0lBQjgtMTglMkNJQUI4LTUlMkNJQUI5LTkmc2thbl9jYW1wYWlnbl9pZD0yMSZydD0wLjAxOSZkZXZpY2VJZFR5cGU9SURGQSZiZj0zLjczJnJ2PXRydWUmYmk9MTAuMC43Ljg2JmFhaT0xMDYwNjkxNTEzJmJsPWZhbHNlJnBhdWNzPUJVQ0tFVDAwMCZicD0yMDAuMCZzYj05NiZzYz0wLjAyODE4MDUxNjEwNDU5MzUzNCZ1aWQ9bDg0M3E4TlNWVUglMkJHQW1OU1IwU0hwJTJGRG5FNCUzRCZhcmE9ZmFsc2Umc2U9JTVCNTAtMTAwJTI5JmJ0PWNwbSZhZG9tYWluPXRlc3QuY29tJnNpPTE0MzQ5NjQmcHVibGlzaGVyQ2FtcGFpZ25Cb29zdD0xLjAmY2E9MTQ5NDY0ODcxNCZjYj1tZWRpdW0mc3M9Q1JTJTNBUk5EX0NQUyUzQUFMX0YlM0ExODAwX0xDJTNBNTAmYnRzPTIwMjEuMDguMDktMTYuMzQmYT12ZXJ5aGlnaCZzdD1VTktOT1dOJmNlPUJfREVGQVVMVCZhcnQ9Tk9ORSZzZXQ9MTA2MDY5MTUxMy5jbGlja2VycyUyQzEyMzQ1Njc4OS5jbGlja2VycyUyQzE0NDM0NDYxNzQuaW5zdGFsbGVkJTJDNzE0NTA4MjI0Lmluc3RhbGxlZCUyQzkxNjg2OTM5NS5pbnN0YWxsZWQlMkNjcm9zc2luc3RhbGwuY3JlYXRpdmUuMC5pbnRlcmFjdGVkJTJDY3Jvc3NpbnN0YWxsLmNyZWF0aXZlLjEwNjA2OTE1MTMuaW50ZXJhY3RlZCUyQ2Nyb3NzaW5zdGFsbC5jcmVhdGl2ZS4xMjM0NTY3ODkuaW50ZXJhY3RlZCZjPUNvbWNhc3QrV2lGaSZkPTIwMjEwODEwJnN6PTQ4MHgzMjAmZz1Vbmtub3duJmNvPXdpZmkmbD1lbiZjcD0xLjAmY3I9Y2lfTW9QdWItMjAyMS0wMS0yNS1lbi0xNXMtMTZ4OS1Nb1B1YlRlc3RTdWNjZXNzZnVsLUhpZ2hSZXNvbHV0aW9uX1BFQy5tcDQmY3M9V0lGSSZwcmVkaWN0ZWRQcmljZT0wLjAmY3g9aW5tb2JpJmRhPSU1QjYwZGF5LTkwZGF5JTVEJnR0PTIwMjEwNzIxLjE2MzAmdHJhY2tpbmdBdXRoU3RhdHVzPUFVVEhPUklaRUQmYWNpPWhEcWsmZGw9bm9uZSZkbT1pUGhvbmUmZG49SUVDK0dsb2JhbCZkcD1jdGFfYnRuX3BlcnNpc3RlbnQlM0FmYWxzZSUyQ2luaXRpYWxfZmlsbGluZyUzQTkwJTJDY3RhX2J0bl90ZXh0JTNBRG93bmxvYWQrTm93JTIxJTJDY3RhX3Njcm5fY2xpY2thYmxlJTNBZmFsc2UlMkNzb3VuZCUzQXRydWUlMkNzb3VuZF9pY29uJTNBZmFsc2UlMkNjdGFfb25faWRsZV90aW1lJTNBMjM3NTAlMkN0dXRvcmlhbCUzQWZhbHNlJnByYXBiPTAuOSZ1aD0wMCZjYW1wYWlnbkdyb3VwVHlwZT1CJTNBK0ZST01fMTRfNV9XSVRIX0lERkFfV0lUSF9TS0FOJnBvc3M9NDgweDMyMCZiaWRfaWQ9MmQ1YzVkYTMtMDE3Yi0xMDAwLWQzZjMtOTU2Y2FiZjIwMDMzJnZlPSZjcGlfZ29hbD0xLjAmdmk9dHJ1ZSZjb250ZW50UmF0aW5nPSZwYXBwcz1CVUNLRVQwMDAmdnI9dHJ1ZSZjaWM9bnVsbCZ2cz10cnVlJmZlPW5vbmUmdnY9VkFTVCszLjAmYXV0PUZJUlNUX1BSSUNFJnRhZ0lkPSZmbz0xNC42JnBjaT1sY2p3JnBjbj1TY2FybGV0dCtUZXN0K0NhbXBhaWduKy0raU9TX3R5cGVfQistK0dyYWRzJnBjcD1OT05FJnRsZD1uZXQmcHJlZGljdGVkUHJpY2VUaWVyPUVJR0hUWV9ET0xMQVJfVElFUiZhZEJvb3N0PTEuMCZoYj1mYWxzZSZhZ2U9VW5rbm93biZwZWNTdXBwb3J0PXRydWUmbW9wdWJfdWFfY3JlYXRpdmVfaWQ9JmRtdj1pUGhvbmUrMTErUHJvK01heCZpbXBfaWQ9MSZhZEFwcElkPTEwNjA2OTE1MTMmb3N2PTE0JmlhPXllcyZ6aXA9OTQzMDEmdmFuZ3VhcmRPcGFjaXR5PTAuMCZpbD1ub25lJmluPWZhbHNlJmN1cnJhcHBWZXJzaW9uPTcuMC4wJnVwZD0wMC0wNiZkbnQ9ZmFsc2UmaXQ9cjQuOHhsYXJnZSZwdWJsaXNoZXJDYW1wYWlnblJ1bGVzQm9vc3Q9MS4wJnppPWZhbHNlJnVwdz13ZWVrZGF5JnBjcnQ9MjAyMS0wNy0wNisxNiUzQTA0JmJsb2NrZWRBZ2VSYXRpbmc9TUFYJnZhbmd1YXJkUmVxdWVzdHM9MS4wJnBjcmE9ZmFsc2UmZXhjaGFuZ2VfYm9vc3Q9MS4wJmxwZD0xMi0xOCZ2Y3I9Tk9ORSZ0cGE9QWRqdXN0JmNudD1VU0EmdXNlclJhdGluZz0mc2tBZE5ldHdvcmtJZENhc2luZz1MT1dFUiZscHc9d2Vla2RheSZiYWdlPU1BWCZnZHByYT1mYWxzZSZsaD0xNyZhZHZlcnRpc2VyQ2FtcGFpZ25Cb29zdD0xLjAmbG89TEFORFNDQVBFJmVjaT1rb2xpYl9pZGxlbV9lMyZmZWk9MCZkYWk9MTAzMTI1MyZkYXA9JTVCMGRheS0xZGF5JTVEJnNlbGVjdGVkUHJpY2VDYXA9MTAwMDAuMCZtYz00NCZwYXBiPTEuMCZlY3Y9OGRmYTA4YjZhN2EzZmI5OWE4MDAwMDAwJm1pPWZhbHNlJmNwc3Q9Tk9ORSZtbj1jYXN1YWwtaW9zLmNvbnZfdnNfY2FzdWFsLWlvcy5pbXAua29rbyZjcHA9ZmFsc2UmbXI9bm8mcndkcj10cnVlJm11PWZhbHNlJm52cD0lNUIxJTVEJmNyZWF0aXZlQWJUZXN0PWZhbHNlJm5hPW1lZGl1bSZuZD1mYWxzZSZkc209bm9uZSZsc2g9MTQlMkMxNSUyQzE2JTJDMTclMkMxOCUyQzE5JTJDMjAmYXBwbGllZFByaWNlQ2FwPWZhbHNlJm50PWZhbHNlJmRzdj0wLjAuMCZudj0lNUIyNS01MCUyOSZ1ZHc9VHVlJmFjcnQ9Tk9ORSZhZHZlcnRpc2VyQ2FtcGFpZ25SdWxlc0Jvb3N0PTEuMCZhcHBSdWxlc0Jvb3N0PTEuMCZvYj0wLjkuMTQmYnBiPSU1Qjc5LjUrdG8rJTJCaW5mJTVEJmFkQXBwQWdlUmF0aW5nPVNFVkVOVEVFTl9QTFVTJnRzdj0lNUI3ZGF5LWluZiU1RCZjYXQ9QXJ0cyslMjYrRW50ZXJ0YWlubWVudCUyQ0hvYmJpZXMrJTI2K0ludGVyZXN0cyUyQ1ZpZGVvKyUyNitDb21wdXRlcitHYW1lcyZtYWtlPUFwcGxlJmxjdT0yMDIxLTA4LTA5KzE2JTNBNDMlM0EwMyZvcj1mYWxzZSZwbGE9bm8mY3JpZD1jaV9Nb1B1Yi0yMDIxLTAxLTI1LWVuLTE1cy0xNng5LU1vUHViVGVzdFN1Y2Nlc3NmdWwtSGlnaFJlc29sdXRpb25fUEVDLm1wNCZvcz1pb3Mmc2thZG5ldHdvcmtWZXJzaW9uPTIuMCZlbmRjYXJkRm9ybWF0PVBMQVlBQkxFJTJDcGxheWFibGUmcGI9MC45MDAwJmZyZXFfYm9vc3Q9bnVsbCZhZHZlcnRpc2VyQm9vc3Q9MS4wJnVzUHJpdmFjeUFwcGxpZXM9ZmFsc2UmYWNyYT1mYWxzZSZnbG9iYWxCb29zdD0wLjI3JnBuPUJhbGwrU29ydCtQdXp6bGUmbGR3PU1vbiZyZXF1ZXN0R3JvdXBUeXBlPUIlM0ErRlJPTV8xNF81X1dJVEhfSURGQV9XSVRIX1NLQU4%3D\";  var ad_click_dest = \"https://step-service.crossinstall.io/skan/click?ad=lcjw&sub=8390542&sub2=2d5c5da3-017b-1000-d3f3-956cabf20033&sub3=1&sub4=1434964&sub10=inmobi&idfa=B3F960B2-321E-460F-9DC8-9DF3AE672CF0&sub9=ci_MoPub-2021-01-25-en-15s-16x9-MoPubTestSuccessful-HighResolution_PEC.mp4&publisher=1494648714&size=480x320&genre=&p=YXM6NDgweDMyMHxhZzowfGdlOjB8Y2I6MnxuYToyfGFsOjR8Y3Q6MnxwYTo1fHBtOjF8cGw6Mg%253D%253D&ctry=US&v=&fei=0&skcid=21&clkT=s2s&impts=1628553633&sub11=[ts]\";  ad_click_dest = ad_click_dest.replace('[ts]', ad_time_series);  var ad_geo_city = \"SAN JOSE\";  var ad_geo_country = \"US\";  var ad_leadin = \"\";  var ad_fonts_to_load = \"spartan\";  if(ad_exchange === \"chartboost\") ad_orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';</script><script type='text/javascript' crossorigin='anonymous' src='https://creatives.crossinstall.com/kolib_idlem_e3/8dfa08b6a7a3fb99a8000000/js/code.js'></script><div id=\"creative\"></div>]]></HTMLResource>\n                            <TrackingEvents>\n                                <Tracking event=\"creativeView\"><![CDATA[https://us-event.app-install.bid/rtb/event/companion?id=YnRyAgMAAAF1jOZYFgAE83cAAAAmw7SHF0YLQaS9PsPwmRk5hgACdXMB]]></Tracking>\n                            </TrackingEvents>\n                            <CompanionClickThrough><![CDATA[https://us-event.app-install.bid/rtb/click?id=YnRyAgMAAAF1jOZYFgAE83cAAAAmw7SHF0YLQaS9PsPwmRk5hgACdXMB&companion=true]]></CompanionClickThrough>\n                        </Companion>\n                    </CompanionAds>\n                </Creative>\n            </Creatives>\n        </InLine>\n    </Ad>\n</VAST>\n",
                    "version": "2.0"
                }
            },
            "vastVideoOrientation": "landscape",
            "videoExperience": 1,
            "rvExpEnabled": true,
            "rvExpScale": 50.5,
            "omidEnabled": true
        }
    ];

    const getAdFormatObject = () => {
        // return {
        //   sdkVersion,
        //   isRewarded,
        //   isSdkPod,
        //   skipDelayInMilliseconds,
        //   maxPodDuration,
        //   closeInsteadOfSkip,
        //   soundOn,
        //   incentiveJson,
        //   vpaidDisabled,
        //   omidEnabled,
        //   rvExpEnabled,
        //   rvExpScaleInMilliseconds,
        //   autoClose,
        //   ctrSrc,
        //   isPod,
        //   secure,
        //   containerHeight,
        //   containerWidth,
        //   viewabilityEnabledMacro,
        //   adChoicesURL,
        //   endCardCloseDelayInMilliseconds,
        //   experienceType,
        //   experienceFamilyType,
        //   pods
        // } as unknown as AdFormatObject;
        return {
            sdkVersion: "4",
            isRewarded: true,
            isSdkPod: false,
            skipDelayInMilliseconds: 1000,
            maxPodDuration: 12,
            closeInsteadOfSkip: true,
            soundOn: true,
            incentiveJson: {},
            vpaidDisabled: true,
            omidEnabled: true,
            rvExpEnabled: false,
            rvExpScaleInMilliseconds: 1000,
            autoClose: true,
            ctrSrc: 'some string',
            isPod: true,
            secure: true,
            containerHeight: 1000,
            containerWidth: 1000,
            viewabilityEnabledMacro: [],
            adChoicesURL: 'something',
            endCardCloseDelayInMilliseconds: 1000,
            experienceType: "0",
            experienceFamilyType: "BrandBase",
            pods: creativeList2.map(item => (Object.assign(Object.assign({}, item), { experienceType: 'BrandBase', ns: 'some id', omidEnabled: true, deviceOS: 'android', sdkVersion: "4", containerHeight: 1000, containerWidth: 1000, secure: true })))
        };
    };
    const getAdFormatObjectURL = () => { var _a; return (_a = window === null || window === void 0 ? void 0 : window.adFormatObject) === null || _a === void 0 ? void 0 : _a.tokenizationRedisCacheURL; };

    const getDeviceOS = () => {
        if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
            return "ios";
        }
        else if (navigator.userAgent.match(/Android/i)) {
            return "android";
        }
        else {
            return "";
        }
    };

    const loadIMRAID = () => new Promise((resolve, reject) => {
        var _a;
        //FIXME  remove for testing
        resolve('ready');
        (_a = window === null || window === void 0 ? void 0 : window.imraid) === null || _a === void 0 ? void 0 : _a.addEventListener("ready", () => {
            debugger;
            if (window.imraid.getState() !== "loading") {
                resolve("ready");
            }
            else {
                reject("failed");
            }
        });
    });
    const isViewable = () => {
        var _a, _b;
        return typeof ((_a = window === null || window === void 0 ? void 0 : window.imraid) === null || _a === void 0 ? void 0 : _a.isViewable) === "function" &&
            ((_b = window === null || window === void 0 ? void 0 : window.imraid) === null || _b === void 0 ? void 0 : _b.isViewable()) || true;
    }; //FIXME remove 
    const setupOnViewableListener = () => {
        return new Promise((resolve, reject) => {
            var _a;
            (_a = window === null || window === void 0 ? void 0 : window.imraid) === null || _a === void 0 ? void 0 : _a.addEventListener("viewableChange", function (viewable) {
                if (viewable) {
                    window.imraid.removeEventListener("viewableChange", arguments.callee);
                    resolve("viewable");
                }
            });
        });
    };
    const setupIMRAIDErrorListener = () => {
        var _a;
        /* add imraid error listener */
        (_a = window.imraid) === null || _a === void 0 ? void 0 : _a.addEventListener("error", function (message) {
            // transitionToIMRAIDError();
            // FIXME relook what to do here
            // var firstValidPod = adListener.getFirstValidPod(); //we can fire from any pod, picking the first valid pod to fire becon
            // globalPodManager.pods[firstValidPod].fireCustomBecon("imraid-error");
        });
    };
    const getIMRAIDAdContext = () => {
        try {
            return JSON.parse(window.imraid.getAdContext());
        }
        catch (e) { }
    };
    const setIMRAIDAdContext = (context) => {
        try {
            window.imraid.setAdContext(JSON.stringify(context));
        }
        catch (e) { }
    };
    const hideDeviceStatusBar = () => {
        var _a;
        // why are we not hiding in android
        if (getDeviceOS() === "ios" && typeof ((_a = window.imraid) === null || _a === void 0 ? void 0 : _a.hideStatusBar) === "function") {
            window.imraid.hideStatusBar();
        }
    };
    const disableDeviceBackButton = () => {
        var _a;
        if (typeof ((_a = window.imraid) === null || _a === void 0 ? void 0 : _a.disableBackButton) === "function") {
            window.imraid.disableBackButton(true);
        }
    };
    const useCustomClose = () => {
        var _a;
        (_a = window.imraid) === null || _a === void 0 ? void 0 : _a.useCustomClose(true);
    };
    const disableDeviceCloseRegion = () => {
        var _a;
        /* disableCloseRegion works on SDK >= 450 */
        if (typeof ((_a = window.imraid) === null || _a === void 0 ? void 0 : _a.disableCloseRegion) === "function") {
            window.imraid.disableCloseRegion(true);
        }
    };
    const loadSkStore = () => new Promise((resolve, reject) => {
        window.imraid.addEventListener("SKStoreContentLoaded", function (listenedBundleId) {
            if (listenedBundleId.toString() === demandBundleId.toString()) {
                resolve("success");
            }
        });
        window.imraid.addEventListener("error", function (message, command) {
            reject("error");
        });
    });
    const openAdChoicesURL = (url) => {
        var _a;
        (_a = window.imraid) === null || _a === void 0 ? void 0 : _a.open(url);
    };
    const openSmartEndCardLandingUrl = (landingUrl) => {
        return new Promise((resolve, reject) => {
            try {
                //using try catch since "openEmbedded" not supported by IOS
                window.imraid.openExternal(landingUrl); //open external
                window.imraid.addEventListener("viewableChange", function (viewable) {
                    if (!viewable) {
                        window.imraid.removeEventListener("viewableChange", arguments.callee);
                        resolve("success");
                    }
                });
            }
            catch (e) {
                reject("error");
            }
        });
    };
    const imraidCloseAd = () => {
        var _a;
        (_a = window.imraid) === null || _a === void 0 ? void 0 : _a.close();
    };
    const getCurrentPodIndex = () => window.imraid.getCurrentRenderingIndex().toString();
    const getRenderablePodIndices = () => window.imraid.getRenderableAdIndexes().replace("[", "").replace("]", "").split(",");
    const isRenderingFirstSdkPod = () => {
        var currentPod = getCurrentPodIndex();
        var validPodIndices = getRenderablePodIndices();
        return validPodIndices.indexOf(currentPod) == "0";
    };
    const hasNextPod = () => {
        var currentPod = getCurrentPodIndex();
        var validPodIndices = getRenderablePodIndices();
        var indexOfAdInRenderablePods = validPodIndices.indexOf(currentPod);
        var renderablePodsLength = validPodIndices.length;
        return indexOfAdInRenderablePods < renderablePodsLength - 1;
    };
    const getNextAdIndex = () => {
        //returns valid index of next ad or else returns nothing
        var currentAd = getCurrentPodIndex();
        var renderableAds = getRenderablePodIndices();
        var indexOfcurrentAdInRenderableAds = renderableAds.indexOf(currentAd);
        var renderableAdsLength = renderableAds.length;
        if (indexOfcurrentAdInRenderableAds < renderableAdsLength - 1) {
            var index = renderableAds[indexOfcurrentAdInRenderableAds + 1];
            return parseInt(index);
        } //returning -1 when we dont have next ad
        return -1;
    };
    const imraidShowAd = (index) => {
        var _a;
        (_a = window.imraid) === null || _a === void 0 ? void 0 : _a.showAd(index);
    };

    const fireInmobiBeacon = (id, extraParams = {}) => {
        //   if (recordEventFun && typeof recordEventFun === "function") {
        //     recordEventFun(id, params);
        //   }
        //
    };
    const VIDEO_BEACON_CODE = {
        RENDER: 18,
        CTA: 8,
        VIDEO_AUTO_PLAY: 10,
        VIDEO_QUARTILE: 12,
        VIDEO_END: 13,
        VIDEO_PAUSE: 14,
        VIDEO_ERROR: 16,
        VIDEO_UNPAUSE: 17,
        CUSTOM: 99,
        CLIENT_FILL: 120,
    };
    const VIDEO_QUARTILE_HASH = {
        FIRST_QUARTILE: { q: 1 },
        SECOND_QUARTILE: { q: 2 },
        THIRD_QUARTILE: { q: 3 },
    };
    const INMOBI_BEACON_POOL = {
        adFormatDataNotFound: () => {
        },
        failedToLoadIMRAID: () => {
        },
        adViewable: () => {
        },
        viewableError: () => { },
        videoCTA: () => fireInmobiBeacon(),
        videoPause: () => fireInmobiBeacon(),
        VASTXMLParseCompleted: (beaconSuffix) => fireInmobiBeacon(VIDEO_BEACON_CODE.CUSTOM, {
            action: `completed-parsing-xml${beaconSuffix}`,
        }),
        VIDEO: {
            firstQuartile: () => fireInmobiBeacon(VIDEO_BEACON_CODE.VIDEO_QUARTILE, {
                q: 1,
            }),
            secondQuartile: () => fireInmobiBeacon(VIDEO_BEACON_CODE.VIDEO_QUARTILE, VIDEO_QUARTILE_HASH.SECOND_QUARTILE),
            thirdQuartile: () => fireInmobiBeacon(VIDEO_BEACON_CODE.VIDEO_QUARTILE, VIDEO_QUARTILE_HASH.THIRD_QUARTILE),
            videoEnd: () => fireInmobiBeacon(),
        },
        POD: {
            podExperienceType: (podId, experienceType) => {
            },
            podDemandAppMetaPresent: (podId) => {
            },
            skipVideoBeacon: (podId) => {
            },
            skipAllVideoBeacon: (podId) => {
            },
        },
        END_CARD: {
            fireInMobiStaticCompanionTypeBeacon: () => {
            },
            fireInMobiIframeCompanionTypeBeacon: () => {
            },
            fireInMobiHTMLCompanionTypeBeacon: () => {
            },
            fireInMobiDefaultTypeBeacon: () => {
            },
            fireOpenLandingPageFromSmartEndCard: () => {
            },
            fireOpenLandingPageFromSmartEndCardError: () => {
            },
        },
        SK_OVERLAY: {
            dismissSkOverlay: () => {
            },
        },
        VPAID: {
            cannotFindAdInstance: (beaconSuffix) => {
            },
            scriptLoadSuccess: (beaconSuffix) => {
            },
            notSupported: (beaconSuffix) => {
            },
        },
        VAST: {
            vastError: (errorCode) => {
            },
            corsEmptyResponse: () => {
            },
            vastProxyEmptyResponse: () => {
            },
            corsSuccess: () => {
            },
            corsFailure: () => {
            },
            vastProxySuccess: () => {
            },
            missingClickThrough: () => {
            },
            newtworkError: (status) => {
            },
            newtworkException: (status) => {
            },
            vastTagNotFound: () => {
            },
            corsFailureWithNetworkException: (status) => {
            },
            durationNodeAbsent: () => {
            },
            invalidVideoSize: (videoSize) => {
            },
            invalidVideoFormat: (videoFormat) => {
            }
        }
    };

    const AD_MACHINE_ACTIONS = {
        "Show endcard": (context, event) => {
            var _a;
            (_a = context.endcardRef) === null || _a === void 0 ? void 0 : _a.send("SHOW");
        },
        "Stop all pods": (context, event) => {
            var _a;
            // stop all pod machines
            (_a = context.podMachines) === null || _a === void 0 ? void 0 : _a.forEach(pod => {
                var _a;
                (_a = pod === null || pod === void 0 ? void 0 : pod.ref) === null || _a === void 0 ? void 0 : _a.stop();
            });
            // Reset the current pod
            context.currentPod = null;
            // stop the timer machine
            context.timerRef = null;
        },
        "Show next sdk pod": (context, event) => {
            const nextAdIndex = getNextAdIndex();
            if (isViewable()) {
                if (nextAdIndex !== -1) {
                    imraidShowAd(nextAdIndex);
                }
            }
            else {
                window.imraid.addEventListener("viewableChange", function (viewable) {
                    if (viewable) {
                        window.imraid.removeEventListener("viewableChange", arguments.callee);
                        if (nextAdIndex !== -1) {
                            imraidShowAd(nextAdIndex);
                        }
                    }
                });
            }
        },
        "Update timer elapsed time": (context, event) => {
        },
        "Reset timer": (context, event) => {
            assign$1((context, event) => {
                return Object.assign(Object.assign({}, context), { timer: Object.assign(Object.assign({}, context.timer), { elapsed: 0 }) });
            });
        },
        "Start current pod": (context, event) => {
            var _a;
            (_a = context.currentPod) === null || _a === void 0 ? void 0 : _a.send("SHOW_VIDEO");
        },
        "IMRAID close Ad": (context, event) => {
            imraidCloseAd();
        },
        "Fire InMobi IMRAID load error": (context, event) => {
        },
        "Fire InMobi beacon for Ad format data error": (context, event) => {
        },
        "Use custom close": (context, event) => {
            useCustomClose();
        },
        "Disable device close region": (context, event) => {
            disableDeviceCloseRegion();
        },
        "Disable device back button": (context, event) => {
            disableDeviceBackButton();
        },
        "Hide device status bar": (context, event) => {
            hideDeviceStatusBar();
        },
        "Setup IMRAID error listener": (context, event) => {
            setupIMRAIDErrorListener();
        },
        "Fire InMobi viewable beacon": (context, event) => {
        },
        "Fire skip video beacon for template pods": (context, event) => {
        },
        "Fire InMobi default end card type beacon": (context, event) => {
            INMOBI_BEACON_POOL.END_CARD.fireInMobiDefaultTypeBeacon();
        },
        "Fire InMobi static companion type beacon": (context, event) => {
            INMOBI_BEACON_POOL.END_CARD.fireInMobiStaticCompanionTypeBeacon();
        },
        "Fire InMobi iframe companion type beacon": (context, event) => {
            INMOBI_BEACON_POOL.END_CARD.fireInMobiIframeCompanionTypeBeacon();
        },
        "Fire InMobi HTML companion type beacon": (context, event) => {
            INMOBI_BEACON_POOL.END_CARD.fireInMobiHTMLCompanionTypeBeacon();
        },
        "Fire companion trackers": (context, evnet) => {
            // get trackers from current pod and fire them
        },
        "Fire InMobi success beacon for open landing page from smart end card": (context, event) => {
            INMOBI_BEACON_POOL.END_CARD.fireInMobiOpenLandingPageBeacon();
        },
        "Fire InMobi error beacon for open landing page from smart end card": (context, event) => {
            INMOBI_BEACON_POOL.END_CARD.fireInMobiOpenLandingPageBeacon();
        },
        "Set IMRAID orientation value for sdk pods": (context, event) => {
            let skipDelayTimeForRewarded = 35000;
            var videoDuration = context.podMachines[0].context.videoDuration;
            var isRewarded = context.podMachines[0].context.isRewarded;
            var skipDelayForNextAd;
            var adContext = getIMRAIDAdContext();
            const deviceOS = getDeviceOS();
            const isFirstPod = isRenderingFirstSdkPod();
            const adOrientationOfFirstPod = context.podMachines[0].context.vastData.adOrientation;
            const adExperienceOfFirstPod = context.podMachines[0].context.experienceType;
            let orientation;
            let experience;
            const removeSkipDelay = () => {
                showSkipButtonFromStart();
            };
            if (isFirstPod) {
                experience = adExperienceOfFirstPod;
                //for firstSdkadPod setorientation, experienceType is already set by default when Sdkadpod is initialized
                if (deviceOS === "android") {
                    orientation = adOrientationOfFirstPod;
                } //setting context for 2nd and subsequent ads, since hasNextAd will change accordingly
                if (isRewarded === "true") {
                    //handle skip delay for non rewarded
                    //update skip delay when we have first video and second ad interstitial, when skip delay is greater than first video
                    //handling skipRewarded delay for rewarded
                    var skipDelayRewarded = skipDelayTimeForRewarded / 1000;
                    if (skipDelayRewarded > videoDuration) {
                        //passing skip delay difference to next ad
                        skipDelayForNextAd = skipDelayRewarded - videoDuration;
                    }
                    else {
                        skipDelayForNextAd = 0;
                    }
                }
            }
            else if (hasNextPod()) {
                //for 2nd ad in SdkadPods get experience and orientation from context and set for current context
                if (deviceOS === "android") {
                    orientation = adContext.orientation;
                }
                experience = adContext.experience;
                if (isRewarded === "false") {
                    removeSkipDelay(); // need to show skip skipall from ad start for second and third ad
                }
                else {
                    // for rewarded get skip delay from context and set to current ad
                    skipDelayTimeForRewarded = adContext.skipDelay * 1000; // pass remaning skip delay to next ad if skip delay is more than current runnning ad
                    var skipDelayRewarded = skipDelayTimeForRewarded / 1000;
                    if (skipDelayRewarded > videoDuration) {
                        //passing skip delay difference to next ad
                        skipDelayForNextAd = skipDelayRewarded - videoDuration;
                    }
                    else {
                        skipDelayForNextAd = 0;
                    }
                }
            }
            else {
                orientation = adContext.experience;
                // handling 3rd ad in ad pod
                if (deviceOS === "android") {
                    orientation = adContext.orientation;
                }
                if (isRewarded === "false") {
                    removeSkipDelay(); // need to show skip skipall from ad start for second and third ad
                }
                else {
                    // for rewarded get skip delay from context and set to current ad
                    skipDelayTimeForRewarded = adContext.skipDelay * 1000;
                }
            }
            setIMRAIDAdContext({
                orientation,
                experience,
                skipDelay: skipDelayForNextAd,
            });
        }
    };

    const AD_MACHINE_DELAYS = {
        "Poll Interval": 100,
        "Max pod duration": (context) => 30 * 1000,
    };

    const AD_MACHINE_GUARDS = {
        'UMP Ad format URL present': () => Boolean(getAdFormatObjectURL()),
        'UMP Ad format object present': (context, _event) => Boolean(context.adFormatObject),
        'Is viewable': () => true ,
        'Is not viewable': () => false ,
        'MRAID library is loaded': () => true ,
        'MRAID library is not loaded': () => false ,
        'Does not have end card and video landing url': () => Boolean(),
        'Has end card': () => Boolean(),
        'Has end card image': () => Boolean(),
        'Has end card iframe resource URL': () => Boolean(),
        'Has end card HTML resource URL': () => Boolean(),
        'Has end card landing URL or companion landing URL': () => Boolean(),
        'Has timed out': (context) => {
            var _a, _b, _c, _d;
            return ((_b = (_a = context.timerRef) === null || _a === void 0 ? void 0 : _a.getSnapshot()) === null || _b === void 0 ? void 0 : _b.context.elapsed) >=
                ((_d = (_c = context.timerRef) === null || _c === void 0 ? void 0 : _c.getSnapshot()) === null || _d === void 0 ? void 0 : _d.context.duration);
        },
        'Has not timed out': (context) => {
            var _a, _b, _c, _d;
            return ((_b = (_a = context.timerRef) === null || _a === void 0 ? void 0 : _a.getSnapshot()) === null || _b === void 0 ? void 0 : _b.context.elapsed) <
                ((_d = (_c = context.timerRef) === null || _c === void 0 ? void 0 : _c.getSnapshot()) === null || _d === void 0 ? void 0 : _d.context.duration);
        },
        'Is base experience type and has a valid video': (context) => { var _a; return Boolean((_a = context.currentPod) === null || _a === void 0 ? void 0 : _a.ref); },
        'Has next Ad': () => false,
        'Is First Pod': () => true,
    };

    const fireThirdPartyBeacon = function (url) {
        const img = new Image();
        img.src = url;
    };
    const fireThirdPartyTrackingUrls = function (trackingUrls) {
        trackingUrls = trackingUrls || [];
        trackingUrls.forEach(function (url) {
            fireThirdPartyBeacon(url);
        });
    };

    const END_CARD_ACTIONS = {
        "Fire third-party end card view trackers": (context, event) => {
            var _a;
            fireThirdPartyTrackingUrls(((_a = context.companionTrackers) === null || _a === void 0 ? void 0 : _a.companionView) || []);
        },
        "Fire incentive beacon": (context, event) => { },
        "Fire InMobi default endcard type beacon": (context, event) => {
            INMOBI_BEACON_POOL.END_CARD.fireInMobiDefaultTypeBeacon();
        },
        "Fire InMobi static companion type beacon": (context, event) => {
            INMOBI_BEACON_POOL.END_CARD.fireInMobiStaticCompanionTypeBeacon();
        },
        "Fire InMobi iframe companion type beacon": (context, event) => {
            INMOBI_BEACON_POOL.END_CARD.fireInMobiIframeCompanionTypeBeacon();
        },
        "Fire InMobi HTML companion type beacon": (context, event) => {
            INMOBI_BEACON_POOL.END_CARD.fireInMobiHTMLCompanionTypeBeacon();
        },
        "Fire companion trackers": (context, event) => {
            var _a;
            const trackingURLs = ((_a = context === null || context === void 0 ? void 0 : context.companionTrackers) === null || _a === void 0 ? void 0 : _a.companionView) || [];
            fireThirdPartyTrackingUrls(trackingURLs);
        },
        "Fire InMobi success beacon for open landing page from smart end card": (context, event) => { },
        "Fire InMobi error beacon for open landing page from smart end card": (context, event) => { },
        "Call IMRAID close": (context, event) => {
            imraidCloseAd();
        }
    };

    const END_CARD_DELAYS = {
        'Endcard close delay': (context) => context.endcardCloseDelayInMilliseconds,
        'Auto Close': (context) => context.autoClose,
        'Close Delay for missing endcard': (context, event) => 1000
    };

    const END_CARD_GUARDS = {
        'Enabled Auto Close': (context) => context.autoClose,
        'Has endcard': (context, _event) => Boolean(context.endcardFound),
        'Has end card image': (context, event) => Boolean(context === null || context === void 0 ? void 0 : context.endCardImageSrc),
        'Has end card iframe resource URL': (context, _event) => Boolean(context === null || context === void 0 ? void 0 : context.endCardIframeResource),
        'Has end card HTML resource URL': (context, _event) => Boolean(context === null || context === void 0 ? void 0 : context.htmlEndCard),
        'Has end card landing URL or companion landing URL': (context, _event) => Boolean((context === null || context === void 0 ? void 0 : context.videoLandingUrl) !== "" || (context === null || context === void 0 ? void 0 : context.companionLandingUrl) !== ""),
        'Does not have endcard and landing URLs': (context, _event) => (!Boolean(context.endcardFound) && context.videoLandingUrl === '') ||
            context.companionLandingUrl == '',
        'Is Perf experience type and smart end card experiment enabled': (context, event) => { },
        'Does not not have endcard and video landing URL is empty': (context, event) => !context.endcardFound && context.videoLandingUrl === ''
    };

    const createEndcardMachine = (context) => createMachine({
        context: context,
        id: 'endcard',
        initial: 'init',
        states: {
            init: {
                entry: [
                    'Fire third-party end card view trackers',
                    'Fire incentive beacon',
                    'Fire companion view trackers'
                ],
                always: [{
                        cond: 'Has endcard',
                        target: 'show',
                    }],
                after: [
                    {
                        cond: 'Does not have endcard and video landing URL is empty',
                        target: 'closeAd',
                        delay: 'Close Delay for missing endcard'
                    }
                ]
            },
            show: {
                initial: 'init',
                after: [{
                        cond: 'Auto close enabled',
                        target: 'closeAd',
                        delay: 'Auto Close'
                    }],
                states: {
                    init: {
                        always: [
                            {
                                cond: 'Has end card image',
                                target: 'staticCompanion',
                            },
                            {
                                cond: 'Has end card iframe resource URL',
                                target: 'iframeCompanion',
                            },
                            {
                                cond: 'Has end card HTML resource URL',
                                target: 'HTMLCompanion',
                            },
                            {
                                cond: 'Has end card landing URL or companion landing URL',
                                target: 'defaultEndcard',
                            },
                        ],
                    },
                    staticCompanion: {
                        entry: [
                            'Fire InMobi static companion type beacon',
                        ],
                    },
                    iframeCompanion: {
                        entry: [
                            'Fire InMobi iframe companion type beacon',
                        ],
                    },
                    HTMLCompanion: {
                        entry: [
                            'Fire InMobi HTML companion type beacon',
                        ],
                    },
                    defaultEndcard: {
                        entry: [
                            'Fire InMobi default endcard type beacon',
                        ],
                        on: {
                            END_CARD_CTA_CLICK: {
                                target: 'landingPage',
                            },
                        },
                    },
                    landingPage: {
                        states: {
                            init: {
                                always: [{
                                        cond: 'Is Perf experience type and smart end card experiment enabled',
                                        target: 'smartEndCard',
                                    }, {
                                        actions: sendParent$1('OPEN_LANDING_PAGE')
                                    }],
                            },
                            smartEndCard: {
                                entry: [
                                    'Fire companion trackers',
                                    'Fire InMobi success beacon for open landing page from smart end card',
                                ],
                                invoke: {
                                    src: (context, _event) => {
                                        var _a, _b, _c;
                                        const url = ((_a = context === null || context === void 0 ? void 0 : context.vastData) === null || _a === void 0 ? void 0 : _a.endCardFound)
                                            ? ((_b = context === null || context === void 0 ? void 0 : context.vastData) === null || _b === void 0 ? void 0 : _b.companionLandingUrl) || ''
                                            : ((_c = context === null || context === void 0 ? void 0 : context.vastData) === null || _c === void 0 ? void 0 : _c.videoLandingUrl) || '';
                                        return openSmartEndCardLandingUrl(url);
                                    },
                                    id: 'smartEndCard',
                                    onDone: {
                                        target: '#endcard.closeAd'
                                    },
                                    onError: [
                                        {
                                            actions: 'Fire InMobi error beacon for open landing page from smart end card',
                                        },
                                    ],
                                },
                            },
                        },
                    },
                },
            },
            closeAd: {
                type: 'final',
                entry: 'Call IMRAID close',
            },
        },
    }, {
        actions: END_CARD_ACTIONS,
        delays: END_CARD_DELAYS,
        guards: END_CARD_GUARDS,
    });

    const POD_MACHINE_ACTIONS = {
        "Fire InMobi video first quartile beacons": (context, event) => {
        },
        "Fire Third-party video first quartile beacons": (context, event) => {
            var _a, _b;
            const trackingURLs = ((_b = (_a = context.vastData) === null || _a === void 0 ? void 0 : _a.trackingUrls) === null || _b === void 0 ? void 0 : _b.firstQuartile) || [];
            fireThirdPartyTrackingUrls(trackingURLs);
        },
        "Fire InMobi video second quartile beacons": (context, event) => {
        },
        "Fire Third-party video second quartile beacons": (context, event) => {
            var _a, _b;
            const trackingURLs = ((_b = (_a = context.vastData) === null || _a === void 0 ? void 0 : _a.trackingUrls) === null || _b === void 0 ? void 0 : _b.midpoint) || [];
            fireThirdPartyTrackingUrls(trackingURLs);
        },
        "Fire InMobi video third quartile beacons": (context, event) => {
        },
        "Fire Third-party video third quartile beacons": (context, event) => {
            var _a, _b;
            const trackingURLs = ((_b = (_a = context.vastData) === null || _a === void 0 ? void 0 : _a.trackingUrls) === null || _b === void 0 ? void 0 : _b.thirdQuartile) || [];
            fireThirdPartyTrackingUrls(trackingURLs);
        },
        "Fire InMobi video complete beacons": (context, event) => {
        },
        "Fire Third-Party video complete beacons": (context, evnet) => {
            var _a, _b;
            const trackingURLs = ((_b = (_a = context.vastData) === null || _a === void 0 ? void 0 : _a.trackingUrls) === null || _b === void 0 ? void 0 : _b.complete) || [];
            fireThirdPartyTrackingUrls(trackingURLs);
        },
        "Fire InMobi experience type beacon": (context, event) => { },
        "Fire InMobi pod demand app metadata present beacon": (context, event) => { },
        "Fire third-party error tracking urls": (context, event) => { },
        "Fire InMobi VPAID version not supported beacon": (context, event) => {
        },
        "Fire InMobi VPAID script load success": (context, event) => {
        },
        "Fire InMobi VPAID cannot find ad instance beacon": (context, event) => {
        },
    };

    const POD_MACHINE_DELAYS = {
        "Max Ad Duration": 33000,
    };

    const POD_MACHINE_GUARDS = {
        "Is IOS device and has demand bundle ID": (context, event) => getDeviceOS() === "ios" && context.demandBundleID,
        "Can access VPAID Ad instance": () => Boolean(window.getVPAIDAd()),
        "Is Perf experience type": (context, event) => Boolean(context.experienceType === "perf"),
        "Is VPAID Ad": (context, event) => { var _a, _b; return Boolean((_b = (_a = context === null || context === void 0 ? void 0 : context.vastData) === null || _a === void 0 ? void 0 : _a.videoData) === null || _b === void 0 ? void 0 : _b.vpaidCreativeJS); },
        "Is not a VPAID Ad": (context, event) => { var _a, _b; return !Boolean((_b = (_a = context === null || context === void 0 ? void 0 : context.vastData) === null || _a === void 0 ? void 0 : _a.videoData) === null || _b === void 0 ? void 0 : _b.vpaidCreativeJS); },
        "Is Brand experience type": (context, event) => true
    };

    const SOUND_MACHINE_ACTIONS = {
        "Fire third-party mute beacons": (context) => {
            fireThirdPartyTrackingUrls(context.muteTrackerURLs);
        },
        "Fire third-party unmute beacons": (context) => {
            fireThirdPartyTrackingUrls(context.unmuteTrackerURLs);
        }
    };

    const SOUND_MACHINE_DELAYS = {};

    const SOUND_MACHINE_GUARDS = {
        "Is Brand experience type": (context, _event) => context.experienceType === "BrandBase",
        "Is not Brand experience type": (context, _event) => !(context.experienceType === "BrandBase")
    };

    const createSoundMachine = (context) => createMachine({
        id: "sound",
        context,
        initial: "init",
        states: {
            init: {
                always: [
                    {
                        cond: "Is Brand experience type",
                        target: "show",
                    },
                    {
                        cond: "Is not Brand experience type",
                        target: "hide",
                    },
                ],
            },
            show: {
                initial: "muted",
                states: {
                    muted: {
                        entry: ["Fire third-party mute beacons"],
                        on: {
                            UNMUTE: {
                                target: "unmuted",
                            },
                        },
                    },
                    unmuted: {
                        entry: ["Fire third-party unmute beacons"],
                        on: {
                            MUTE: {
                                target: "muted",
                            },
                        },
                    },
                },
            },
            hide: {
                type: "final",
            },
        },
    }, {
        actions: SOUND_MACHINE_ACTIONS,
        guards: SOUND_MACHINE_GUARDS,
        delays: SOUND_MACHINE_DELAYS
    });

    var vastBlob = {}, containerWidth, containerHeight, videoHeight, videoWidth, adOrientation, demandOverrideOrientation, errorCode, sendBeacon, successCallback, warningCodes = [], sendErrorBeacon, errorCallback, deviceOS, omidEnabled, sdkVersion, secure;
    var MAX_WRAPPER_REDIRECTS = 6, MIN_COMPANION_ASPECT_RATIO = 0.2, errorTrackingUrls = [], PROXY_URL = "http://vastproxy.brand.inmobi.com/g/", SECURE_PROXY_URL = "https://vastproxy.brand.inmobi.com/gs/", redirect = 0, iframeEndCardUrl, htmlEndCard, trackingEventsMap = {}, impressionTrackers = [], wrapperCompanionTrackers = {};
    var viewabilityExtensions = [];
    function removeWhiteSpace(string) {
        return string.replace(/(\r\n|\n|\r|\t)/gm, "").replace(/^ */, "").replace(/ *$/, "");
    }
    function activeViewRegExTest(vastUrl, proxyPass) {
        if (!proxyPass) {
            var dbmRegex = /bid\.g\.doubleclick\.net/g;
            var dcmRegex = /ad\.doubleclick\.net\/ddm/g;
            var queryParamCheck = /\?.+=/g;
            var urlContainsQueryParams = queryParamCheck.test(vastUrl);
            if (dbmRegex.test(vastUrl)) {
                vastUrl = urlContainsQueryParams ? vastUrl.concat('&sdk3p=inmobi&osd=2') : vastUrl.concat('?sdk3p=inmobi&osd=2');
                vastUrl = omidEnabled ? vastUrl.concat('&dc_sdk_apis=7&dc_omid_p=Inmobi/', sdkVersion) : vastUrl;
            }
            else if (dcmRegex.test(vastUrl)) {
                vastUrl = vastUrl.concat(';sdk3p=inmobi;dc_osd=2');
                vastUrl = omidEnabled ? vastUrl.concat('&dc_sdk_apis=7&dc_omid_p=Inmobi/', sdkVersion) : vastUrl;
            }
        }
        return vastUrl;
    }
    function sendXmlRequest(url, isProxy, successCallback) {
        var response = "", reqUrl;
        url = activeViewRegExTest(url, isProxy);
        var request = new XMLHttpRequest();
        try {
            /* make an async call */
            request.open("GET", url, true);
            request.onload = function (e) {
                if (request.readyState === 4) {
                    if (request.status === 200) {
                        //Checking for empty responses
                        if (request.responseText === "" || request.responseText === null) {
                            if (isProxy) {
                                sendBeacon(99, {
                                    "action": "cors_empty_response"
                                });
                            }
                            else {
                                sendBeacon(99, {
                                    "action": "vastProxy_empty_response"
                                });
                            }
                        }
                        else {
                            response = isProxy ? JSON.parse(request.responseText).content : request.responseText;
                            //Beacons for CORS/Studio
                            if (isProxy) {
                                sendBeacon(99, {
                                    "action": "cors_success"
                                });
                            }
                            else {
                                //response = JSON.parse(response).content;
                                sendBeacon(99, {
                                    "action": "vastProxy_success"
                                });
                            }
                        }
                    }
                    else {
                        sendErrorBeacon(errorTrackingUrls, 301);
                        sendBeacon(99, {
                            "action": "network_error_" + request.status
                        });
                    }
                }
                parseVastXml(response, successCallback);
            };
            request.onerror = function () {
                /* Network Error */
                if (!isProxy) {
                    sendBeacon(99, {
                        "action": "cors_failure"
                    });
                    reqUrl = removeWhiteSpace(url);
                    reqUrl = reqUrl.replace(/^https?:\/\//, "");
                    reqUrl = ((secure) ? SECURE_PROXY_URL : PROXY_URL) + encodeURIComponent(reqUrl);
                    response = sendXmlRequest(reqUrl, true, successCallback);
                }
                else {
                    sendBeacon(99, {
                        "action": "cors_failure",
                        "label": "network_error_" + request.status
                    });
                    sendErrorBeacon(errorTrackingUrls, 301);
                    parseVastXml(response, successCallback);
                }
            };
            request.send();
        }
        catch (e) {
            sendBeacon(99, {
                "action": "network_exception_" + request.status
            });
            parseVastXml(response, successCallback);
        }
    }
    function getVideoTrackers(xmlDocument) {
        var linearCreative = xmlDocument.querySelector("Linear");
        var impressionNodes = xmlDocument.getElementsByTagName("Impression") || [];
        var i;
        /* play is considered as impression for VAST videos */
        for (i = 0; i < impressionNodes.length; i++) {
            var iNContent = removeWhiteSpace(impressionNodes[i].textContent);
            if (!(iNContent === "" || iNContent == null)) {
                if (impressionTrackers && impressionTrackers.length > 0) {
                    impressionTrackers.push(iNContent);
                }
                else {
                    impressionTrackers = [iNContent];
                }
            }
        }
        if (!linearCreative) {
            return {
                "impressionTrackers": impressionTrackers,
                "trackingEventsMap": trackingEventsMap
            };
        }
        else {
            var trackingEventNodes = linearCreative.getElementsByTagName("Tracking") || [];
            var clickTrackingNodes = linearCreative.getElementsByTagName("ClickTracking") || [];
            var eventName, eventUrl;
            for (i = 0; i < trackingEventNodes.length; i++) {
                eventName = trackingEventNodes[i].getAttribute("event") || "";
                eventUrl = removeWhiteSpace(trackingEventNodes[i].textContent) || "";
                if (eventName && eventUrl) {
                    if (trackingEventsMap[eventName]) {
                        trackingEventsMap[eventName].push(eventUrl);
                    }
                    else {
                        trackingEventsMap[eventName] = [eventUrl];
                    }
                }
            }
            for (i = 0; i < clickTrackingNodes.length; i++) {
                var cTNContent = removeWhiteSpace(clickTrackingNodes[i].textContent);
                if (!(cTNContent === "" || cTNContent == null)) {
                    if (trackingEventsMap["clickTracking"]) {
                        trackingEventsMap["clickTracking"].push(cTNContent);
                    }
                    else {
                        trackingEventsMap["clickTracking"] = [cTNContent];
                    }
                }
            }
        }
        return {
            "impressionTrackers": impressionTrackers,
            "trackingEventsMap": trackingEventsMap
        };
    }
    function isValidVideoFormat(videoMimeType) {
        var androidVideoTypes = ["video/mp4", "video/3gp", "video/webm", "video/x-flv", "application/javascript"];
        var iOSVideoTypes = ["video/mp4", "video/3gp", "video/quicktime", "application/javascript"];
        var targetVideoTypeList = [];
        switch (deviceOS) {
            case "android":
                targetVideoTypeList = androidVideoTypes;
                break;
            case "ios":
                targetVideoTypeList = iOSVideoTypes;
                break;
        }
        return targetVideoTypeList.indexOf(videoMimeType) !== -1;
    }
    function getVideoUrl(mediaNodes, durationNode) {
        var videoDuration, videoOrientation;
        var maxMediaSize = 30 * Math.pow(10, 6), minMediaSize = 1 * Math.pow(10, 4);
        if (durationNode !== null) {
            var maxDuration = 32;
            videoDuration = durationNode.textContent;
            videoDuration = videoDuration.replace(/:/g, "-");
            var durArr = videoDuration.split("-");
            videoDuration = parseInt(durArr[2], 10);
            if (!(parseInt(durArr[0], 10) === 0 && parseInt(durArr[1], 10) === 0 && parseInt(durArr[2], 10) <= parseInt(maxDuration, 10))) {
                sendErrorBeacon(errorTrackingUrls, 202);
                /* Don't show the ad when video duraion is greater than maximum allowed duration */
                return "";
            }
        }
        else {
            /* Ad not shown in case duration node is null */
            sendBeacon(99, { "action": "duration-node-absent" });
            sendErrorBeacon(errorTrackingUrls, 202);
            return "";
        }
        var pickedVideoObj;
        var typesOfVideo = [];
        var invalidVideoSize = [];
        var landscapeVideos = {}, verticalVideos = {};
        var portraitAd = (adOrientation === "portrait");
        var vpaidMediaFile;
        function compareVideos(video1, video2, isVertical) {
            var video1Height = video1.getAttribute("height") || 10;
            var video1Width = video1.getAttribute("width") || 10;
            var video2Height = video2.getAttribute("height") || 10;
            var video2Width = video2.getAttribute("width") || 10;
            var comp1, comp2;
            if (!isVertical) {
                comp1 = Math.abs(containerWidth - video1Width);
                comp2 = Math.abs(containerWidth - video2Width);
            }
            else {
                comp1 = Math.abs(containerHeight - video1Height);
                comp2 = Math.abs(containerHeight - video2Height);
            }
            return comp1 > comp2 ? video2 : video1;
        }
        for (i = 0; i < mediaNodes.length; i++) {
            // console.log("mediaNodes.length" + mediaNodes.length);
            var mediaNode = mediaNodes[i];
            var deliveryType = (mediaNode.getAttribute("delivery") || "").toLowerCase();
            var bitRate = mediaNode.getAttribute("bitrate") || 100;
            var width = parseInt(mediaNode.getAttribute("width"), 10) || 10;
            var height = parseInt(mediaNode.getAttribute("height"), 10) || 10;
            var videoType = (mediaNode.getAttribute("type") || "").toLowerCase();
            var apiFramework = (mediaNode.getAttribute("apiFramework") || "").toLowerCase();
            // console.log("deliveryType" + deliveryType + "\tbitRate:" + bitRate + "\tvideoType" + videoType);
            if (deliveryType === "progressive" && isValidVideoFormat(videoType)) {
                // console.log("isValidVideoFormat is true");
                if (apiFramework === "vpaid") {
                    // console.log("got vpaid media node");
                    vpaidMediaFile = mediaNode;
                }
                else {
                    var size = (bitRate * videoDuration * 1024) / 8;
                    if (size >= minMediaSize && size < maxMediaSize) {
                        var j = videoType === "video/mp4" ? 0 : 1;
                        if (width > height) {
                            if (landscapeVideos[j]) {
                                landscapeVideos[j] = compareVideos(landscapeVideos[j], mediaNode, false);
                            }
                            else {
                                landscapeVideos[j] = mediaNode;
                            }
                        }
                        else if (width <= height) {
                            if (verticalVideos[j]) {
                                verticalVideos[j] = compareVideos(verticalVideos[j], mediaNode, true);
                            }
                            else {
                                verticalVideos[j] = mediaNode;
                            }
                        }
                    }
                    else if (size < minMediaSize && size >= maxMediaSize) {
                        invalidVideoSize.push(size);
                    }
                }
            }
            else if (!isValidVideoFormat(videoType)) {
                if (typesOfVideo.indexOf(videoType) === -1) {
                    typesOfVideo.push(videoType);
                }
            }
        }
        var landscapeVideoOriObj = landscapeVideos[0] ? landscapeVideos[0] : landscapeVideos[1];
        var verticalVideoOriObj = verticalVideos[0] ? verticalVideos[0] : verticalVideos[1];
        if (!portraitAd) {
            if (landscapeVideoOriObj) {
                videoOrientation = "landscape";
                pickedVideoObj = landscapeVideoOriObj;
            }
            else if (verticalVideoOriObj) {
                videoOrientation = "portrait";
                pickedVideoObj = verticalVideoOriObj;
            }
        }
        else {
            //console.log("vertical video");
            if (verticalVideoOriObj) {
                videoOrientation = "portrait";
                pickedVideoObj = verticalVideoOriObj;
            }
            else if (landscapeVideoOriObj) {
                pickedVideoObj = landscapeVideoOriObj;
                videoOrientation = "landscape";
            }
        }
        if (pickedVideoObj || vpaidMediaFile) {
            // console.log("calling getVideoMeta");
            return getVideoMeta(pickedVideoObj, videoOrientation, videoDuration, vpaidMediaFile);
        }
        else {
            if (typesOfVideo.length > 0) {
                for (var i = 0; i < typesOfVideo.length; i++) {
                    sendBeacon(99, {
                        "action": "invalid_format_" + typesOfVideo[i]
                    });
                }
                sendErrorBeacon(errorTrackingUrls, 403);
            }
            if (invalidVideoSize.length > 0) {
                for (var i = 0; i < invalidVideoSize.length; i++) {
                    sendBeacon(99, {
                        "action": "invalid_size_" + invalidVideoSize[i]
                    });
                }
                sendErrorBeacon(errorTrackingUrls, 203);
            }
            return "";
        }
    }
    function getVideoMeta(pickedVideoObj, videoOrientation, videoDuration, vpaidMediaFile) {
        // console.log("Initial containerHeight" + containerHeight);
        // console.log("Initial containerWidth" + containerWidth);
        // console.log("demandOverrideOrientation" + demandOverrideOrientation);
        var videoUrl = "";
        var vpaidCreativeJS = "";
        if (pickedVideoObj) {
            if (demandOverrideOrientation) {
                adOrientation = videoOrientation;
            }
            if ((adOrientation === "portrait" && containerHeight < containerWidth) ||
                (adOrientation === "landscape" && containerHeight > containerWidth)) {
                // console.log("swapping h & w");
                swapContainerDimension();
            }
            if (adOrientation !== videoOrientation) {
                // console.log("adOrientation mismatch");
                if (adOrientation === "landscape") {
                    videoHeight = containerHeight;
                    videoWidth = containerHeight * (containerHeight / containerWidth);
                }
                else {
                    videoHeight = containerWidth * (containerWidth / containerHeight);
                    videoWidth = containerWidth;
                }
            }
            else {
                videoHeight = containerHeight;
                videoWidth = containerWidth;
            }
            videoUrl = removeWhiteSpace(pickedVideoObj.textContent);
        }
        else if (vpaidMediaFile) {
            vpaidCreativeJS = removeWhiteSpace(vpaidMediaFile.textContent);
        }
        // console.log("containerHeight" + containerHeight);
        // console.log("containerWidth" + containerWidth);
        return {
            "vidUrl": videoUrl,
            "videoWidth": videoWidth,
            "videoHeight": videoHeight,
            "containerHeight": containerHeight,
            "containerWidth": containerWidth,
            "videoOrientation": videoOrientation,
            "videoDuration": videoDuration,
            "vpaidCreativeJS": vpaidCreativeJS
        };
    }
    function swapContainerDimension() {
        containerHeight = "$supplyWidth";
        containerWidth = "$supplyHeight";
    }
    function getStaticCompanion(staticCompanionNodes) {
        var selected = null, staticNode = null, regEx = /^image/i; /* creativeType begins with image & do a case insensitive search */
        staticCompanionNodes = staticCompanionNodes || [];
        for (var i = 0, len = staticCompanionNodes.length; i < len; i++) {
            staticNode = staticCompanionNodes[i];
            if (regEx.test(staticNode.getAttribute("creativeType"))) {
                selected = staticNode;
                //console.log("static selected");
                break;
            }
        }
        return selected;
    }
    function getCompanionAd(xmlDocument) {
        var inlineNode = xmlDocument.querySelector("InLine"), companionAdRoot = inlineNode.querySelector("CompanionAds"), companionAds = companionAdRoot ? companionAdRoot.querySelectorAll("Companion") : [], selectedCompanionNode = null, selectedCompanion = null, staticResourceFound = false, videoAspectRatio = videoWidth / videoHeight, bestFitCompanionAspectRatio = -99, bestFitCompanionWidth = videoWidth, bestFitCompanionHeight = videoHeight;
        if (companionAds.length > 0) {
            for (var i = 0, len = companionAds.length; i < len; i++) {
                var companionAdNode = companionAds[i];
                var companionWidth = parseInt(companionAdNode.getAttribute("assetWidth"))
                    || parseInt(companionAdNode.getAttribute("width")) || videoWidth;
                var companionHeight = parseInt(companionAdNode.getAttribute("assetHeight")) ||
                    parseInt(companionAdNode.getAttribute("height")) || videoHeight;
                if (companionWidth && companionHeight) {
                    var companionAspectRatio = companionWidth / companionHeight;
                    var staticResource = getStaticCompanion(companionAdNode.querySelectorAll("StaticResource"));
                    /* select only image type static companion ads */
                    if (staticResource) {
                        staticResourceFound = true;
                        // console.log("videoHeight" + videoHeight);
                        // console.log("videoWidth" + videoWidth);
                        // console.log("videoAspectRatio" + videoAspectRatio);
                        // console.log("companionAspectRatio" + companionAspectRatio);
                        var comp1 = Math.abs(videoAspectRatio - bestFitCompanionAspectRatio), comp2 = Math.abs(videoAspectRatio - companionAspectRatio);
                        if (companionWidth >= videoWidth && companionHeight >= videoHeight) {
                            // console.log("h& w more than video h&w");
                            // console.log("comp2" + comp2);
                            // console.log("comp1" + comp1);
                            if (comp2 < comp1) {
                                bestFitCompanionAspectRatio = companionAspectRatio;
                                selectedCompanionNode = companionAdNode;
                                if (Math.abs(videoAspectRatio - companionAspectRatio) <= MIN_COMPANION_ASPECT_RATIO) {
                                    // console.log("diff less than MIN_COMPANION_ASPECT_RATIO");
                                    bestFitCompanionWidth = videoWidth;
                                    bestFitCompanionHeight = videoHeight;
                                }
                                else {
                                    bestFitCompanionWidth = companionWidth;
                                    bestFitCompanionHeight = companionHeight;
                                }
                            }
                        }
                        else if (comp2 < comp1 && (selectedCompanionNode == null ||
                            (bestFitCompanionHeight * bestFitCompanionHeight > companionHeight * companionWidth))) {
                            bestFitCompanionAspectRatio = companionAspectRatio;
                            selectedCompanionNode = companionAdNode;
                            bestFitCompanionWidth = companionWidth;
                            bestFitCompanionHeight = companionHeight;
                        }
                        // console.log("bestFitCompanionWidth" + bestFitCompanionWidth);
                        // console.log("bestFitCompanionHeight" + bestFitCompanionHeight);
                        // console.log("companionWidth" + companionWidth);
                        // console.log("companionHeight" + companionHeight);
                    }
                }
            }
        }
        if (htmlEndCard === "" && iframeEndCardUrl === "" && ((staticResourceFound && selectedCompanionNode == null) || (!staticResourceFound && companionAds.length > 0))) {
            warningCodes.push(601);
        }
        if (selectedCompanionNode) {
            var companionClickThrough = selectedCompanionNode.querySelector("CompanionClickThrough");
            companionClickThrough = companionClickThrough ? removeWhiteSpace(companionClickThrough.textContent) : '';
            selectedCompanion = {
                width: bestFitCompanionWidth <= videoWidth ? bestFitCompanionWidth : videoWidth,
                height: bestFitCompanionHeight <= videoHeight ? bestFitCompanionHeight : videoHeight,
                url: removeWhiteSpace(getStaticCompanion(selectedCompanionNode.querySelectorAll("StaticResource")).textContent) || "",
                compTrackers: getCompanionTrackers(selectedCompanionNode),
                companionClickThrough: companionClickThrough
            };
        }
        return selectedCompanion;
    }
    function getCompanionTrackers(companionRoot) {
        var compTrackers = {};
        if (!companionRoot) {
            return compTrackers;
        }
        var trackingEventNodes = companionRoot.querySelectorAll("Tracking[event='creativeView']") || [];
        var clickTrackingNodes = companionRoot.querySelectorAll("CompanionClickTracking") || [];
        var cTNContent, eventUrl, i, eventName = "companionView";
        for (i = 0; i < trackingEventNodes.length; i++) {
            eventUrl = removeWhiteSpace(trackingEventNodes[i].textContent) || "";
            if (eventUrl) {
                if (compTrackers[eventName]) {
                    compTrackers[eventName].push(eventUrl);
                }
                else {
                    compTrackers[eventName] = [eventUrl];
                }
            }
        }
        for (i = 0; i < clickTrackingNodes.length; i++) {
            cTNContent = removeWhiteSpace(clickTrackingNodes[i].textContent);
            if (cTNContent) {
                if (compTrackers["companionClick"]) {
                    compTrackers["companionClick"].push(cTNContent);
                }
                else {
                    compTrackers["companionClick"] = [cTNContent];
                }
            }
        }
        return compTrackers;
    }
    function getRichEndCardUrl(inlineNode) {
        var richEndCardNode = inlineNode.querySelector("CompanionAds IFrameResource");
        iframeEndCardUrl = richEndCardNode ? removeWhiteSpace(richEndCardNode.textContent) : "";
        var htmlEndCardNode = inlineNode.querySelector("CompanionAds HTMLResource");
        htmlEndCard = htmlEndCardNode ? removeWhiteSpace(htmlEndCardNode.textContent) : "";
    }
    function mergeWrapperTrackers(trackers) {
        var compKey = '', j;
        var keys = Object.keys(wrapperCompanionTrackers);
        if (!keys.length) {
            wrapperCompanionTrackers = trackers;
        }
        else {
            for (compKey in trackers) {
                if (keys.indexOf(compKey) !== -1) {
                    for (j = 0; j < trackers[compKey].length; j++) {
                        wrapperCompanionTrackers[compKey].push(trackers[compKey][j]);
                    }
                }
            }
        }
        return wrapperCompanionTrackers;
    }
    /**
    * TODO: Parse Vast Extensions from the Vast xml.
    * This should do the following
    * 1. Parse the extensions for MOAT
    * 2. Parse the extensions for omsdk
    * 3. Parse the extensions for ias
    * 4. Return a struct encapsulating all these.
    */
    function getViewabilityTrackersFromVast(node) {
        // console.log("Will start parsing viewability vendors");
        function VastExtensionObj(trackerType, vendor, url, urlType, type, value, verParams, apiFramework, browserOptional, verificationParams) {
            this.trackerType = trackerType;
            this.vendor = vendor;
            this.url = url;
            this.urlType = urlType;
            this.type = type;
            this.value = value;
            this.verParams = verParams;
            this.apiFramework = apiFramework;
            this.browserOptional = browserOptional;
            this.verificationParams = verificationParams;
        }
        var extensionNodes, extensionNode, querySelectorNodes, i, j, vendor;
        var vastExtensionObjs = [];
        var parseMoatAndGoogleExtensions = function (extensionNode) {
            var moatAndGoogleExtentionObjs = [];
            var parseMoatVerificationNode = function (verificationNode, vendor) {
                // console.log("Will start parsing moat trackers");
                if (vendor && vendor.toLowerCase() === "moat") {
                    vendor = "moat";
                    var viewableImpNode = verificationNode.querySelector("ViewableImpression");
                    if (viewableImpNode) {
                        viewableImpNode = viewableImpNode.outerHTML.replace(/\n\s+/g, "");
                        var vastExtnObj = new VastExtensionObj("viewability", vendor, null, null, "xmlNode", removeWhiteSpace(viewableImpNode));
                        moatAndGoogleExtentionObjs.push(vastExtnObj);
                    }
                }
            };
            var parseGoogleVerificationNode = function (verificationNode, vendor) {
                // console.log("Will start parsing google trackers");
                if (vendor && vendor.toLowerCase() === "doubleclickbygoogle.com") {
                    vendor = "doubleclickbygoogle.com";
                    var javascriptResourceNode = verificationNode.querySelector("JavaScriptResource");
                    var verParamsNode = verificationNode.querySelector("VerificationParameters");
                    if (javascriptResourceNode && verParamsNode) {
                        var extensionUrl = removeWhiteSpace(javascriptResourceNode.textContent);
                        var vastExtnObj = new VastExtensionObj("viewability", vendor, extensionUrl, "script", "url", null, removeWhiteSpace(verParamsNode.textContent));
                        moatAndGoogleExtentionObjs.push(vastExtnObj);
                    }
                }
            };
            //Parse Extension node for Moat ViewableImpression node.
            querySelectorNodes = extensionNode.querySelectorAll("AdVerifications Verification");
            for (j = 0; j < querySelectorNodes.length; j++) {
                var verificationNode = querySelectorNodes[j];
                vendor = verificationNode ? verificationNode.getAttribute("vendor") : "";
                moatAndGoogleExtentionObjs.concat(parseMoatVerificationNode(verificationNode, vendor));
                moatAndGoogleExtentionObjs.concat(parseGoogleVerificationNode(verificationNode, vendor));
            }
            return moatAndGoogleExtentionObjs;
        };
        var parseIASExtensions = function (extensionNode) {
            // console.log("Will start parsing ias trackers");
            var iasExtentionObjs = [];
            // Parse Extension node for IAS
            querySelectorNodes = extensionNode.querySelectorAll("AVID AdVerifications JavaScriptResource");
            for (j = 0; j < querySelectorNodes.length; j++) {
                var javascriptResourceNode = querySelectorNodes[j];
                if (javascriptResourceNode) {
                    vendor = "ias";
                    var extensionUrl = removeWhiteSpace(javascriptResourceNode.textContent);
                    var vastExtnObj = new VastExtensionObj("viewability", vendor, extensionUrl, "script", "url", null);
                    iasExtentionObjs.push(vastExtnObj);
                }
            }
            return iasExtentionObjs;
        };
        var parseOMExtensions = function (extensionNode) {
            // console.log("Will start parsing omsdk trackers");
            var extensionNodes = extensionNode.querySelectorAll("Extension");
            var adVerificationsNodes = node.querySelectorAll("InLine > AdVerifications");
            var vastObjs = [];
            for (var i = 0; i < extensionNodes.length; i++) {
                vastObjs = vastObjs.concat(getOmsdkObjectHelper(extensionNodes[i], "extension"));
            }
            if (adVerificationsNodes.length > 0) {
                vastObjs = vastObjs.concat(getOmsdkObjectHelper(adVerificationsNodes, "adverification"));
            }
            return vastObjs;
        };
        // function VastExtensionObj(trackerType, vendor, url, urlType, type, value, verParams, apiFramework, browserOptional, verificationParams)
        function getOmsdkObjectHelper(nodes, nodeType) {
            var omExtentionObjs = [];
            var querySelectorNodes = nodeType === "extension" ? nodes.querySelectorAll("AdVerifications") : nodes;
            for (var j = 0; j < querySelectorNodes.length; j++) {
                var verificationNodes = querySelectorNodes[j].querySelectorAll("Verification");
                for (var k = 0; k < verificationNodes.length; k++) {
                    var javascriptResourceNode = verificationNodes[k].querySelectorAll("JavaScriptResource");
                    var verificationParameterNode = verificationNodes[k].querySelectorAll("VerificationParameters");
                    var url = null, apiFrameWork = null, browserOptional = null, vendor = null, trackerType = null, type = null, value = null, urlType = null;
                    vendor = verificationNodes[k].getAttribute("vendor");
                    var verificationParams = verificationParameterNode.length > 0 && verificationParameterNode[0].textContent ? verificationParameterNode[0].textContent.trim() : "";
                    if (javascriptResourceNode.length > 0) {
                        url = javascriptResourceNode[0].textContent ? javascriptResourceNode[0].textContent.trim() : "";
                        browserOptional = javascriptResourceNode[0].getAttribute("browserOptional");
                        apiFrameWork = javascriptResourceNode[0].getAttribute("apiFramework");
                        if (javascriptResourceNode[0].getAttribute("apiFramework") && javascriptResourceNode[0].getAttribute("apiFramework").indexOf("omid") === 0) {
                            trackerType = "omsdk-viewability";
                        }
                        else {
                            trackerType = "viewability";
                            type = "xmlNode";
                            value = verificationNodes[k].querySelector("ViewableImpression") ? verificationNodes[k].querySelector("ViewableImpression").outerHTML.replace(/\n\s+/g, "").trim() : "";
                        }
                        var vastExtnObj = new VastExtensionObj(trackerType, vendor, url, urlType, type, value, null, apiFrameWork, browserOptional, verificationParams);
                        omExtentionObjs.push(vastExtnObj);
                    }
                }
            }
            return omExtentionObjs;
        }
        // Process all the extension node.
        extensionNodes = node.querySelectorAll("Extension");
        //Parse Extension Nodes for OMSDK
        var OMSDKObjects = parseOMExtensions(node);
        vastExtensionObjs = vastExtensionObjs.concat(OMSDKObjects);
        for (i = 0; i < extensionNodes.length; i++) {
            var extensionNode = extensionNodes[i];
            vastExtensionObjs = vastExtensionObjs.concat(parseMoatAndGoogleExtensions(extensionNode));
            vastExtensionObjs = vastExtensionObjs.concat(parseIASExtensions(extensionNode));
        }
        return vastExtensionObjs;
    }
    function parseVastXml(xml, successCallback) {
        var parsedXml, errorNodes, vastAdTagUrl, url, parseErrorNodes, vastVersion = '', videoMeta, companionAd, inlineNodes, linearNodes, vastAdTag, clickThroughUrl = '';
        var impressionTrackers = [];
        var trackingEventsMap = {};
        var companionAdsNode;
        var compTrackers = [];
        /* used to track response errors during parsing */
        var unwrappingSuccess = false;
        if (xml) {
            parsedXml = (new DOMParser()).parseFromString(xml, "text/xml");
            parseErrorNodes = parsedXml.getElementsByTagName("parsererror");
            if (parseErrorNodes.length === 0) {
                vastAdTag = parsedXml.querySelector("VAST");
                if (!vastAdTag) {
                    sendBeacon(99, { "action": "no-vast-tag" });
                    errorCallback(405);
                    return;
                }
                else {
                    errorNodes = parsedXml.getElementsByTagName("Error");
                    vastVersion = vastAdTag.getAttribute("version");
                    if (errorNodes.length > 0) {
                        /* collect all error URL's */
                        for (var i = 0; i < errorNodes.length; i++) {
                            var eNContent = removeWhiteSpace(errorNodes[i].textContent);
                            if (!(eNContent === "" || eNContent == null)) {
                                errorTrackingUrls.push(eNContent);
                            }
                        }
                    }
                    if (vastVersion !== "2.0" && vastVersion !== "3.0" && vastVersion !== "4.0" && vastVersion !== "4.1") {
                        sendErrorBeacon(errorTrackingUrls, 102);
                        errorCallback(102);
                        return;
                    }
                    var trackersObj = getVideoTrackers(parsedXml);
                    impressionTrackers = trackersObj.impressionTrackers;
                    trackingEventsMap = trackersObj.trackingEventsMap;
                    vastAdTagUrl = parsedXml.getElementsByTagName("VASTAdTagURI");
                    if (vastAdTagUrl.length > 0) {
                        /* Wrapper Ad : get XML from URL specified in <VASTAdTagURI> */
                        viewabilityExtensions = viewabilityExtensions.concat(getViewabilityTrackersFromVast(parsedXml));
                        url = removeWhiteSpace(vastAdTagUrl[0].textContent);
                        if (redirect < MAX_WRAPPER_REDIRECTS) {
                            redirect++;
                            sendXmlRequest(url, false, successCallback);
                            return;
                        }
                    }
                    else {
                        inlineNodes = parsedXml.getElementsByTagName("InLine");
                        if (inlineNodes.length > 0) {
                            linearNodes = inlineNodes[0].getElementsByTagName("Linear");
                            if (linearNodes.length > 0) {
                                /* found an inline ad */
                                unwrappingSuccess = true;
                                if (!compTrackers.length) {
                                    companionAdsNode = parsedXml.querySelector("CompanionAds");
                                    compTrackers = getCompanionTrackers(companionAdsNode);
                                    compTrackers = mergeWrapperTrackers(compTrackers);
                                }
                                var adParametersNode = parsedXml.querySelector("AdParameters");
                                var adParameters = (adParametersNode != null) ? adParametersNode.textContent : "";
                                var mediaNodes = parsedXml.querySelectorAll("Linear MediaFile"), durationNode = parsedXml.querySelector("Duration");
                                /* get asset urls */
                                var clickThroughNode = linearNodes[0].querySelector("ClickThrough");
                                if (null != clickThroughNode && null != clickThroughNode.textContent) {
                                    clickThroughUrl = removeWhiteSpace(clickThroughNode.textContent);
                                }
                                else {
                                    sendBeacon(99, {
                                        "action": "missingClickThrough"
                                    });
                                }
                                videoMeta = getVideoUrl(mediaNodes, durationNode);
                                if (videoMeta === "" || typeof videoMeta === "undefined") {
                                    unwrappingSuccess = false;
                                    errorCode = 405;
                                }
                                // console.log("videoMeta" + JSON.stringify(videoMeta));
                                getRichEndCardUrl(inlineNodes[0]);
                                viewabilityExtensions = viewabilityExtensions.concat(getViewabilityTrackersFromVast(parsedXml));
                                companionAd = getCompanionAd(parsedXml);
                                vastBlob = {
                                    "version": vastVersion,
                                    "videoData": videoMeta,
                                    "companionAd": companionAd,
                                    "trackingUrls": trackingEventsMap,
                                    "impressionTracker": impressionTrackers,
                                    "errorTrackingUrls": errorTrackingUrls,
                                    "vidClickThrough": clickThroughUrl,
                                    "richEndCardUrl": iframeEndCardUrl,
                                    "htmlEndCard": htmlEndCard,
                                    "companionTrackers": compTrackers,
                                    "warningCodes": warningCodes,
                                    "viewabilityExtensions": viewabilityExtensions,
                                    "adParameters": adParameters
                                };
                            }
                            else {
                                errorCode = 201;
                            }
                        }
                        else {
                            /* ERROR 303: No ads in VAST response after one or more wrappers */
                            errorCode = 303;
                        }
                    }
                }
            }
            else {
                /* ERROR 100: XML Parsing Error */
                errorCode = 100;
            }
        }
        else {
            /* ERROR 900: Undefined Error like "NetworkError" */
            errorCode = 900;
        }
        if (redirect === MAX_WRAPPER_REDIRECTS && !unwrappingSuccess) {
            /* ERROR 302: Wrapper limit as defined by player reached */
            errorCode = 302;
        }
        if (unwrappingSuccess) {
            successCallback(vastBlob);
        }
        else {
            sendErrorBeacon(errorTrackingUrls, errorCode);
            errorCallback(errorCode);
        }
    }
    const getVastXmlData = (options) => {
        var vastContent = options.vastContent;
        sendBeacon = options.sendBeacon;
        sendErrorBeacon = options.sendErrorBeacon;
        errorCallback = options.errorCallback;
        successCallback = options.successCallback;
        adOrientation = options.adOrientation;
        containerHeight = options.adHeight;
        containerWidth = options.adWidth;
        demandOverrideOrientation = options.demandOverrideOrientation;
        deviceOS = options.deviceOS;
        omidEnabled = options.omidEnabled;
        sdkVersion = options.sdkVersion;
        secure = options.secure;
        // console.log("Will start parsing xml.");
        if (vastContent.url) {
            redirect++;
            sendXmlRequest(vastContent.url, false, successCallback);
        }
        else {
            parseVastXml(vastContent.vastXml, successCallback);
        }
    };

    const getVASTData = ({ vastContent, videoOrientation, containerHeight, containerWidth, deviceOS, viewabilityEnabledMacro, omidEnabled, sdkVersion }) => new Promise((resolve, reject) => {
        getVastXmlData({
            vastContent,
            sendBeacon: (params) => {
            },
            sendErrorBeacon: (params) => {
            },
            errorCallback: (error) => {
                reject('failed');
            },
            successCallback: (vastData) => {
                console.dir(vastData);
                resolve(vastData);
            },
            adOrientation: videoOrientation,
            containerHeight,
            containerWidth,
            deviceOS,
            viewabilityEnabledMacro,
            omidEnabled,
            sdkVersion
        });
    });

    const loadVPAIDScripts = (url) => new Promise((resolve, reject) => { });

    const createPodMachine = (podDetails) => createMachine({
        context: podDetails,
        id: 'pod',
        initial: 'init',
        states: {
            init: {
                entry: [
                    'Fire InMobi experience type beacon',
                    'Fire InMobi pod demand app metadata present beacon',
                ],
                always: {
                    target: 'vast',
                },
            },
            vast: {
                initial: 'init',
                states: {
                    init: {
                        always: {
                            target: 'parse',
                        },
                    },
                    parse: {
                        invoke: {
                            src: (context, event) => getVASTData({
                                vastContent: context.video.vast,
                                videoOrientation: context.vastVideoOrientation,
                                containerHeight: context.containerHeight,
                                containerWidth: context.containerWidth,
                                deviceOS: context.deviceOS,
                                viewabilityEnabledMacro: context.viewabilityEnabledMacro,
                                omidEnabled: context.omidEnabled,
                                sdkVersion: context.sdkVersion,
                            }),
                            id: 'parsing',
                            onDone: {
                                actions: assign$1({
                                    vastData: (_context, event) => event.data,
                                }),
                                target: '#pod.video',
                            },
                            onError: {
                                target: 'error',
                            },
                        },
                    },
                    error: {},
                },
            },
            video: {
                entry: [
                    assign$1({
                        soundRef: (context, event) => {
                            var _a, _b, _c, _d;
                            return spawn(createSoundMachine({
                                experienceType: context.experienceType,
                                muteTrackingURLs: ((_b = (_a = context.vastData) === null || _a === void 0 ? void 0 : _a.trackingUrls) === null || _b === void 0 ? void 0 : _b.mute) || [],
                                unmuteTrackingURLs: ((_d = (_c = context.vastData) === null || _c === void 0 ? void 0 : _c.trackingUrls) === null || _d === void 0 ? void 0 : _d.unmute) || [],
                            }), { sync: true });
                        },
                    }),
                ],
                type: 'parallel',
                states: {
                    skStore: {
                        initial: 'load',
                        states: {
                            init: {
                                always: {
                                    cond: 'Is IOS device and has demand bundle ID',
                                    target: 'load',
                                },
                            },
                            load: {
                                entry: 'Fire SK store loading beacon',
                                invoke: {
                                    src: (context, event) => loadSkStore(),
                                    id: 'loading',
                                    onDone: [
                                        {
                                            target: 'success',
                                        },
                                    ],
                                    onError: [
                                        {
                                            target: 'error',
                                        },
                                    ],
                                },
                            },
                            success: {
                                entry: 'Fire InMobi Sk store load success beacon',
                                on: {
                                    SHOW: {
                                        target: 'show',
                                    },
                                },
                            },
                            error: {
                                entry: 'Fire InMobi Sk store load failure beacon',
                                type: 'final',
                            },
                            show: {
                                entry: 'Fire Open Sk Overlay InMobi Beacon',
                                always: [
                                    {
                                        cond: 'Has skan params',
                                        target: 'showOverlayWithSkan',
                                    },
                                    {
                                        target: 'showOverlayWithoutSkanParams',
                                    },
                                ],
                            },
                            showOverlayWithSkan: {
                                entry: [
                                    'setupSkStoreOverlayWithSkanParamsErrorListener',
                                    'IMRAIDShowSkOverlayWithSkanParams',
                                ],
                                on: {
                                    DISMISS: {
                                        target: 'dismissOverlay',
                                    },
                                },
                            },
                            showOverlayWithoutSkanParams: {
                                entry: [
                                    'setupSkStoreOverlayWithSkanParamsErrorListener',
                                    'IMRAIDShowSkOverlayWithoutSkanParams',
                                ],
                                on: {
                                    DISMISS: {
                                        target: 'dismissOverlay',
                                    },
                                },
                            },
                            dismissOverlay: {
                                entry: [
                                    'IMRAID dismiss sk overlay',
                                    'Fire InMobi Sk overlay dismiss beacon',
                                ],
                            },
                        },
                    },
                    video: {
                        initial: 'init',
                        states: {
                            init: {
                                always: [
                                    {
                                        cond: 'Is VPAID Ad',
                                        target: 'vpaid',
                                    },
                                    {
                                        cond: 'Is not a VPAID Ad',
                                        target: 'default',
                                    },
                                ],
                            },
                            default: {
                                id: 'defaultVideoPlayer',
                                initial: 'init',
                                states: {
                                    init: {
                                        on: {
                                            READY: {
                                                target: 'ready',
                                            },
                                        },
                                    },
                                    ready: {
                                        on: {
                                            SHOW_VIDEO: {
                                                target: 'show',
                                            },
                                        },
                                    },
                                    show: {
                                        entry: [
                                            'Hide Volume Buttons for Brand Experience Type',
                                            'Add Pulse Effect to CTA',
                                            'Update CTA Button Source',
                                            'Show Video Element',
                                        ],
                                        always: {
                                            target: 'playing',
                                        },
                                    },
                                    playing: {
                                        entry: [
                                            'Play Video Element',
                                            'Play Video Element if VPaid',
                                            'fireVideoPlayingInmobiBeacon',
                                            'Show Sk Overlay',
                                        ],
                                        initial: 'init',
                                        states: {
                                            init: {
                                                after: {
                                                    'Max Ad Duration': {
                                                        target: '#pod.video.video.vpaid.stop',
                                                    },
                                                },
                                                on: {
                                                    FIRST_QUARTILE: {
                                                        target: 'firstQuartile',
                                                    },
                                                },
                                            },
                                            firstQuartile: {
                                                entry: [
                                                    'Fire InMobi video first quartile beacons',
                                                    'Fire Third-party video first quartile beacons',
                                                ],
                                                on: {
                                                    SECOND_QUARTILE: {
                                                        target: 'secondQuartile',
                                                    },
                                                },
                                            },
                                            secondQuartile: {
                                                entry: [
                                                    'Fire InMobi video second quartile beacons',
                                                    'Fire Third-party video second quartile beacons',
                                                ],
                                                on: {
                                                    THIRD_QUARTILE: {
                                                        target: 'thirdQuartile',
                                                    },
                                                },
                                            },
                                            thirdQuartile: {
                                                entry: [
                                                    'Fire InMobi video third quartile beacons',
                                                    'Fire Third-party video third quartile beacons',
                                                ],
                                                on: {
                                                    VIDEO_COMPLETE: {
                                                        target: 'completed',
                                                    },
                                                },
                                            },
                                            completed: {
                                                entry: [
                                                    'Fire InMobi video complete beacons',
                                                    'Fire Third-Party video complete beacons',
                                                ],
                                            },
                                        },
                                        on: {
                                            PAUSE: {
                                                actions: ['showPausedIcon', 'fire'],
                                                target: 'paused',
                                            },
                                            STOP: {
                                                actions: 'resetTimer',
                                                target: 'init',
                                            },
                                            COMPLETED: {
                                                target: 'completed',
                                            },
                                        },
                                    },
                                    paused: {
                                        entry: [
                                            'Fire InMobi video pause beacon',
                                            'Fire InMobi pause third party beacon',
                                        ],
                                    },
                                    canPlay: {},
                                    completed: {
                                        on: {
                                            RESET: {
                                                actions: 'reset',
                                                target: 'init',
                                            },
                                        },
                                    },
                                    videoError: {
                                        entry: 'Fire InMobi video error beacon',
                                        type: 'final',
                                    },
                                },
                            },
                            vpaid: {
                                initial: 'loadScript',
                                states: {
                                    loadScript: {
                                        invoke: {
                                            src: (context, event) => loadVPAIDScripts(),
                                            id: 'loadVpaidScript',
                                            onDone: [
                                                {
                                                    actions: 'Fire InMobi VPAID script load success',
                                                    target: 'init',
                                                },
                                            ],
                                            onError: [
                                                {
                                                    actions: 'Fire InMobi VPAID script load failure',
                                                    target: 'error',
                                                },
                                            ],
                                        },
                                    },
                                    init: {
                                        always: [
                                            {
                                                cond: 'Can access VPAID Ad instance',
                                                target: 'ready',
                                            },
                                            {
                                                actions: 'Fire InMobi VPAID cannot find ad instance beacon',
                                                cond: 'Cannot access VPAID Ad instance',
                                                target: 'error',
                                            },
                                        ],
                                    },
                                    ready: {
                                        entry: 'Attach event handlers to VPAID Ad Instance',
                                        on: {
                                            SHOW: {
                                                target: 'show',
                                            },
                                        },
                                    },
                                    show: {
                                        always: [
                                            {
                                                cond: 'Is a supported version',
                                                target: 'playing',
                                            },
                                            {
                                                actions: [
                                                    'Fire InMobi VPAID version not supported beacon',
                                                    'Fire third-party error tracking urls',
                                                ],
                                                cond: 'Is not a supported version',
                                                target: 'error',
                                            },
                                        ],
                                    },
                                    playing: {
                                        initial: 'init',
                                        states: {
                                            init: {
                                                after: {
                                                    'Max Ad Duration': {
                                                        target: '#pod.video.video.vpaid.stop',
                                                    },
                                                },
                                                on: {
                                                    FIRST_QUARTILE: {
                                                        target: 'firstQuartile',
                                                    },
                                                },
                                            },
                                            firstQuartile: {
                                                entry: [
                                                    'Fire InMobi video first quartile beacons',
                                                    'Fire Third-party video first quartile beacons',
                                                ],
                                                on: {
                                                    SECOND_QUARTILE: {
                                                        target: 'secondQuartile',
                                                    },
                                                },
                                            },
                                            secondQuartile: {
                                                entry: [
                                                    'Fire InMobi video second quartile beacons',
                                                    'Fire Third-party video second quartile beacons',
                                                ],
                                                on: {
                                                    THIRD_QUARTILE: {
                                                        target: 'thirdQuartile',
                                                    },
                                                },
                                            },
                                            thirdQuartile: {
                                                entry: [
                                                    'Fire InMobi video third quartile beacons',
                                                    'Fire Third-party video third quartile beacons',
                                                ],
                                                on: {
                                                    VIDEO_COMPLETE: {
                                                        target: 'completed',
                                                    },
                                                },
                                            },
                                            completed: {
                                                entry: [
                                                    'Fire InMobi video complete beacons',
                                                    'Fire InMobi VPAID video complete beacons',
                                                    'Fire Third-Party video complete beacons',
                                                ],
                                            },
                                        },
                                    },
                                    stop: {},
                                    error: {
                                        entry: 'Fire third-party error tracking urls',
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    }, {
        actions: POD_MACHINE_ACTIONS,
        guards: POD_MACHINE_GUARDS,
        delays: POD_MACHINE_DELAYS,
    });

    const SKIP_BUTTON_GUARDS = {
        'show close instead of skip': (context) => context === null || context === void 0 ? void 0 : context.closeInsteadOfSkip,
        'Is not a valid experience type': (context) => { }
    };

    const createSkipButtonMachine = () => createMachine({
        id: 'skip',
        initial: 'init',
        states: {
            init: {
                always: [
                    {
                        cond: 'Is not a valid experience type',
                        target: 'hide',
                    },
                    {
                        cond: 'show close instead of skip',
                        target: 'hide',
                    },
                    {
                        target: 'show',
                    },
                ],
            },
            show: {},
            hide: {
                type: 'final'
            },
        }
    }, { guards: SKIP_BUTTON_GUARDS });

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    var _tslib$1 = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, '__esModule', { value: true });

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    exports.__assign = function() {
        exports.__assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return exports.__assign.apply(this, arguments);
    };

    function __rest(s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    }

    function __values(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m) return m.call(o);
        if (o && typeof o.length === "number") return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }

    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    }

    function __spreadArray(to, from, pack) {
        if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
            if (ar || !(i in from)) {
                if (!ar) ar = Array.prototype.slice.call(from, 0, i);
                ar[i] = from[i];
            }
        }
        return to.concat(ar || Array.prototype.slice.call(from));
    }

    exports.__read = __read;
    exports.__rest = __rest;
    exports.__spreadArray = __spreadArray;
    exports.__values = __values;
    });

    var types$1 = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, '__esModule', { value: true });

    exports.ActionTypes = void 0;

    (function (ActionTypes) {
      ActionTypes["Start"] = "xstate.start";
      ActionTypes["Stop"] = "xstate.stop";
      ActionTypes["Raise"] = "xstate.raise";
      ActionTypes["Send"] = "xstate.send";
      ActionTypes["Cancel"] = "xstate.cancel";
      ActionTypes["NullEvent"] = "";
      ActionTypes["Assign"] = "xstate.assign";
      ActionTypes["After"] = "xstate.after";
      ActionTypes["DoneState"] = "done.state";
      ActionTypes["DoneInvoke"] = "done.invoke";
      ActionTypes["Log"] = "xstate.log";
      ActionTypes["Init"] = "xstate.init";
      ActionTypes["Invoke"] = "xstate.invoke";
      ActionTypes["ErrorExecution"] = "error.execution";
      ActionTypes["ErrorCommunication"] = "error.communication";
      ActionTypes["ErrorPlatform"] = "error.platform";
      ActionTypes["ErrorCustom"] = "xstate.error";
      ActionTypes["Update"] = "xstate.update";
      ActionTypes["Pure"] = "xstate.pure";
      ActionTypes["Choose"] = "xstate.choose";
    })(exports.ActionTypes || (exports.ActionTypes = {}));

    exports.SpecialTargets = void 0;

    (function (SpecialTargets) {
      SpecialTargets["Parent"] = "#_parent";
      SpecialTargets["Internal"] = "#_internal";
    })(exports.SpecialTargets || (exports.SpecialTargets = {}));
    });

    var types = types$1;

    var start = types.ActionTypes.Start;
    var stop = types.ActionTypes.Stop;
    var raise = types.ActionTypes.Raise;
    var send$1 = types.ActionTypes.Send;
    var cancel = types.ActionTypes.Cancel;
    var nullEvent = types.ActionTypes.NullEvent;
    var assign = types.ActionTypes.Assign;
    var after = types.ActionTypes.After;
    var doneState = types.ActionTypes.DoneState;
    var log = types.ActionTypes.Log;
    var init = types.ActionTypes.Init;
    var invoke = types.ActionTypes.Invoke;
    var errorExecution = types.ActionTypes.ErrorExecution;
    var errorPlatform = types.ActionTypes.ErrorPlatform;
    var error = types.ActionTypes.ErrorCustom;
    var update = types.ActionTypes.Update;
    var choose = types.ActionTypes.Choose;
    var pure = types.ActionTypes.Pure;

    var after_1 = after;
    var assign_1 = assign;
    var cancel_1 = cancel;
    var choose_1 = choose;
    var doneState_1 = doneState;
    var error_1 = error;
    var errorExecution_1 = errorExecution;
    var errorPlatform_1 = errorPlatform;
    var init_1 = init;
    var invoke_1 = invoke;
    var log_1 = log;
    var nullEvent_1 = nullEvent;
    var pure_1 = pure;
    var raise_1 = raise;
    var send_1 = send$1;
    var start_1 = start;
    var stop_1 = stop;
    var update_1 = update;

    var actionTypes$1 = /*#__PURE__*/Object.defineProperty({
    	after: after_1,
    	assign: assign_1,
    	cancel: cancel_1,
    	choose: choose_1,
    	doneState: doneState_1,
    	error: error_1,
    	errorExecution: errorExecution_1,
    	errorPlatform: errorPlatform_1,
    	init: init_1,
    	invoke: invoke_1,
    	log: log_1,
    	nullEvent: nullEvent_1,
    	pure: pure_1,
    	raise: raise_1,
    	send: send_1,
    	start: start_1,
    	stop: stop_1,
    	update: update_1
    }, '__esModule', {value: true});

    var STATE_DELIMITER = '.';
    var EMPTY_ACTIVITY_MAP = {};
    var DEFAULT_GUARD_TYPE = 'xstate.guard';
    var TARGETLESS_KEY = '';

    var DEFAULT_GUARD_TYPE_1 = DEFAULT_GUARD_TYPE;
    var EMPTY_ACTIVITY_MAP_1 = EMPTY_ACTIVITY_MAP;
    var STATE_DELIMITER_1 = STATE_DELIMITER;
    var TARGETLESS_KEY_1 = TARGETLESS_KEY;

    var constants$1 = /*#__PURE__*/Object.defineProperty({
    	DEFAULT_GUARD_TYPE: DEFAULT_GUARD_TYPE_1,
    	EMPTY_ACTIVITY_MAP: EMPTY_ACTIVITY_MAP_1,
    	STATE_DELIMITER: STATE_DELIMITER_1,
    	TARGETLESS_KEY: TARGETLESS_KEY_1
    }, '__esModule', {value: true});

    var IS_PRODUCTION = undefined === 'production';

    var IS_PRODUCTION_1 = IS_PRODUCTION;

    var environment$1 = /*#__PURE__*/Object.defineProperty({
    	IS_PRODUCTION: IS_PRODUCTION_1
    }, '__esModule', {value: true});

    var _tslib = _tslib$1;

    var constants = constants$1;

    var environment = environment$1;

    var utils$2 = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, '__esModule', { value: true });





    var _a;
    function keys(value) {
      return Object.keys(value);
    }
    function matchesState(parentStateId, childStateId, delimiter) {
      if (delimiter === void 0) {
        delimiter = constants.STATE_DELIMITER;
      }

      var parentStateValue = toStateValue(parentStateId, delimiter);
      var childStateValue = toStateValue(childStateId, delimiter);

      if (isString(childStateValue)) {
        if (isString(parentStateValue)) {
          return childStateValue === parentStateValue;
        } // Parent more specific than child


        return false;
      }

      if (isString(parentStateValue)) {
        return parentStateValue in childStateValue;
      }

      return Object.keys(parentStateValue).every(function (key) {
        if (!(key in childStateValue)) {
          return false;
        }

        return matchesState(parentStateValue[key], childStateValue[key]);
      });
    }
    function getEventType(event) {
      try {
        return isString(event) || typeof event === 'number' ? "".concat(event) : event.type;
      } catch (e) {
        throw new Error('Events must be strings or objects with a string event.type property.');
      }
    }
    function getActionType(action) {
      try {
        return isString(action) || typeof action === 'number' ? "".concat(action) : isFunction(action) ? action.name : action.type;
      } catch (e) {
        throw new Error('Actions must be strings or objects with a string action.type property.');
      }
    }
    function toStatePath(stateId, delimiter) {
      try {
        if (isArray(stateId)) {
          return stateId;
        }

        return stateId.toString().split(delimiter);
      } catch (e) {
        throw new Error("'".concat(stateId, "' is not a valid state path."));
      }
    }
    function isStateLike(state) {
      return typeof state === 'object' && 'value' in state && 'context' in state && 'event' in state && '_event' in state;
    }
    function toStateValue(stateValue, delimiter) {
      if (isStateLike(stateValue)) {
        return stateValue.value;
      }

      if (isArray(stateValue)) {
        return pathToStateValue(stateValue);
      }

      if (typeof stateValue !== 'string') {
        return stateValue;
      }

      var statePath = toStatePath(stateValue, delimiter);
      return pathToStateValue(statePath);
    }
    function pathToStateValue(statePath) {
      if (statePath.length === 1) {
        return statePath[0];
      }

      var value = {};
      var marker = value;

      for (var i = 0; i < statePath.length - 1; i++) {
        if (i === statePath.length - 2) {
          marker[statePath[i]] = statePath[i + 1];
        } else {
          marker[statePath[i]] = {};
          marker = marker[statePath[i]];
        }
      }

      return value;
    }
    function mapValues(collection, iteratee) {
      var result = {};
      var collectionKeys = Object.keys(collection);

      for (var i = 0; i < collectionKeys.length; i++) {
        var key = collectionKeys[i];
        result[key] = iteratee(collection[key], key, collection, i);
      }

      return result;
    }
    function mapFilterValues(collection, iteratee, predicate) {
      var e_1, _a;

      var result = {};

      try {
        for (var _b = _tslib.__values(Object.keys(collection)), _c = _b.next(); !_c.done; _c = _b.next()) {
          var key = _c.value;
          var item = collection[key];

          if (!predicate(item)) {
            continue;
          }

          result[key] = iteratee(item, key, collection);
        }
      } catch (e_1_1) {
        e_1 = {
          error: e_1_1
        };
      } finally {
        try {
          if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        } finally {
          if (e_1) throw e_1.error;
        }
      }

      return result;
    }
    /**
     * Retrieves a value at the given path.
     * @param props The deep path to the prop of the desired value
     */

    var path = function (props) {
      return function (object) {
        var e_2, _a;

        var result = object;

        try {
          for (var props_1 = _tslib.__values(props), props_1_1 = props_1.next(); !props_1_1.done; props_1_1 = props_1.next()) {
            var prop = props_1_1.value;
            result = result[prop];
          }
        } catch (e_2_1) {
          e_2 = {
            error: e_2_1
          };
        } finally {
          try {
            if (props_1_1 && !props_1_1.done && (_a = props_1.return)) _a.call(props_1);
          } finally {
            if (e_2) throw e_2.error;
          }
        }

        return result;
      };
    };
    /**
     * Retrieves a value at the given path via the nested accessor prop.
     * @param props The deep path to the prop of the desired value
     */

    function nestedPath(props, accessorProp) {
      return function (object) {
        var e_3, _a;

        var result = object;

        try {
          for (var props_2 = _tslib.__values(props), props_2_1 = props_2.next(); !props_2_1.done; props_2_1 = props_2.next()) {
            var prop = props_2_1.value;
            result = result[accessorProp][prop];
          }
        } catch (e_3_1) {
          e_3 = {
            error: e_3_1
          };
        } finally {
          try {
            if (props_2_1 && !props_2_1.done && (_a = props_2.return)) _a.call(props_2);
          } finally {
            if (e_3) throw e_3.error;
          }
        }

        return result;
      };
    }
    function toStatePaths(stateValue) {
      if (!stateValue) {
        return [[]];
      }

      if (isString(stateValue)) {
        return [[stateValue]];
      }

      var result = flatten(Object.keys(stateValue).map(function (key) {
        var subStateValue = stateValue[key];

        if (typeof subStateValue !== 'string' && (!subStateValue || !Object.keys(subStateValue).length)) {
          return [[key]];
        }

        return toStatePaths(stateValue[key]).map(function (subPath) {
          return [key].concat(subPath);
        });
      }));
      return result;
    }
    function pathsToStateValue(paths) {
      var e_4, _a;

      var result = {};

      if (paths && paths.length === 1 && paths[0].length === 1) {
        return paths[0][0];
      }

      try {
        for (var paths_1 = _tslib.__values(paths), paths_1_1 = paths_1.next(); !paths_1_1.done; paths_1_1 = paths_1.next()) {
          var currentPath = paths_1_1.value;
          var marker = result; // tslint:disable-next-line:prefer-for-of

          for (var i = 0; i < currentPath.length; i++) {
            var subPath = currentPath[i];

            if (i === currentPath.length - 2) {
              marker[subPath] = currentPath[i + 1];
              break;
            }

            marker[subPath] = marker[subPath] || {};
            marker = marker[subPath];
          }
        }
      } catch (e_4_1) {
        e_4 = {
          error: e_4_1
        };
      } finally {
        try {
          if (paths_1_1 && !paths_1_1.done && (_a = paths_1.return)) _a.call(paths_1);
        } finally {
          if (e_4) throw e_4.error;
        }
      }

      return result;
    }
    function flatten(array) {
      var _a;

      return (_a = []).concat.apply(_a, _tslib.__spreadArray([], _tslib.__read(array), false));
    }
    function toArrayStrict(value) {
      if (isArray(value)) {
        return value;
      }

      return [value];
    }
    function toArray(value) {
      if (value === undefined) {
        return [];
      }

      return toArrayStrict(value);
    }
    function mapContext(mapper, context, _event) {
      var e_5, _a;

      if (isFunction(mapper)) {
        return mapper(context, _event.data);
      }

      var result = {};

      try {
        for (var _b = _tslib.__values(Object.keys(mapper)), _c = _b.next(); !_c.done; _c = _b.next()) {
          var key = _c.value;
          var subMapper = mapper[key];

          if (isFunction(subMapper)) {
            result[key] = subMapper(context, _event.data);
          } else {
            result[key] = subMapper;
          }
        }
      } catch (e_5_1) {
        e_5 = {
          error: e_5_1
        };
      } finally {
        try {
          if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        } finally {
          if (e_5) throw e_5.error;
        }
      }

      return result;
    }
    function isBuiltInEvent(eventType) {
      return /^(done|error)\./.test(eventType);
    }
    function isPromiseLike(value) {
      if (value instanceof Promise) {
        return true;
      } // Check if shape matches the Promise/A+ specification for a "thenable".


      if (value !== null && (isFunction(value) || typeof value === 'object') && isFunction(value.then)) {
        return true;
      }

      return false;
    }
    function isBehavior(value) {
      return value !== null && typeof value === 'object' && 'transition' in value && typeof value.transition === 'function';
    }
    function partition(items, predicate) {
      var e_6, _a;

      var _b = _tslib.__read([[], []], 2),
          truthy = _b[0],
          falsy = _b[1];

      try {
        for (var items_1 = _tslib.__values(items), items_1_1 = items_1.next(); !items_1_1.done; items_1_1 = items_1.next()) {
          var item = items_1_1.value;

          if (predicate(item)) {
            truthy.push(item);
          } else {
            falsy.push(item);
          }
        }
      } catch (e_6_1) {
        e_6 = {
          error: e_6_1
        };
      } finally {
        try {
          if (items_1_1 && !items_1_1.done && (_a = items_1.return)) _a.call(items_1);
        } finally {
          if (e_6) throw e_6.error;
        }
      }

      return [truthy, falsy];
    }
    function updateHistoryStates(hist, stateValue) {
      return mapValues(hist.states, function (subHist, key) {
        if (!subHist) {
          return undefined;
        }

        var subStateValue = (isString(stateValue) ? undefined : stateValue[key]) || (subHist ? subHist.current : undefined);

        if (!subStateValue) {
          return undefined;
        }

        return {
          current: subStateValue,
          states: updateHistoryStates(subHist, subStateValue)
        };
      });
    }
    function updateHistoryValue(hist, stateValue) {
      return {
        current: stateValue,
        states: updateHistoryStates(hist, stateValue)
      };
    }
    function updateContext(context, _event, assignActions, state) {
      if (!environment.IS_PRODUCTION) {
        exports.warn(!!context, 'Attempting to update undefined context');
      }

      var updatedContext = context ? assignActions.reduce(function (acc, assignAction) {
        var e_7, _a;

        var assignment = assignAction.assignment;
        var meta = {
          state: state,
          action: assignAction,
          _event: _event
        };
        var partialUpdate = {};

        if (isFunction(assignment)) {
          partialUpdate = assignment(acc, _event.data, meta);
        } else {
          try {
            for (var _b = _tslib.__values(Object.keys(assignment)), _c = _b.next(); !_c.done; _c = _b.next()) {
              var key = _c.value;
              var propAssignment = assignment[key];
              partialUpdate[key] = isFunction(propAssignment) ? propAssignment(acc, _event.data, meta) : propAssignment;
            }
          } catch (e_7_1) {
            e_7 = {
              error: e_7_1
            };
          } finally {
            try {
              if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            } finally {
              if (e_7) throw e_7.error;
            }
          }
        }

        return Object.assign({}, acc, partialUpdate);
      }, context) : context;
      return updatedContext;
    } // tslint:disable-next-line:no-empty

    exports.warn = function () {};

    if (!environment.IS_PRODUCTION) {
      exports.warn = function (condition, message) {
        var error = condition instanceof Error ? condition : undefined;

        if (!error && condition) {
          return;
        }

        if (console !== undefined) {
          var args = ["Warning: ".concat(message)];

          if (error) {
            args.push(error);
          } // tslint:disable-next-line:no-console


          console.warn.apply(console, args);
        }
      };
    }
    function isArray(value) {
      return Array.isArray(value);
    } // tslint:disable-next-line:ban-types

    function isFunction(value) {
      return typeof value === 'function';
    }
    function isString(value) {
      return typeof value === 'string';
    }
    function toGuard(condition, guardMap) {
      if (!condition) {
        return undefined;
      }

      if (isString(condition)) {
        return {
          type: constants.DEFAULT_GUARD_TYPE,
          name: condition,
          predicate: guardMap ? guardMap[condition] : undefined
        };
      }

      if (isFunction(condition)) {
        return {
          type: constants.DEFAULT_GUARD_TYPE,
          name: condition.name,
          predicate: condition
        };
      }

      return condition;
    }
    function isObservable(value) {
      try {
        return 'subscribe' in value && isFunction(value.subscribe);
      } catch (e) {
        return false;
      }
    }
    var symbolObservable = /*#__PURE__*/function () {
      return typeof Symbol === 'function' && Symbol.observable || '@@observable';
    }(); // TODO: to be removed in v5, left it out just to minimize the scope of the change and maintain compatibility with older versions of integration paackages

    var interopSymbols = (_a = {}, _a[symbolObservable] = function () {
      return this;
    }, _a[Symbol.observable] = function () {
      return this;
    }, _a);
    function isMachine(value) {
      return !!value && '__xstatenode' in value;
    }
    function isActor(value) {
      return !!value && typeof value.send === 'function';
    }
    var uniqueId = /*#__PURE__*/function () {
      var currentId = 0;
      return function () {
        currentId++;
        return currentId.toString(16);
      };
    }();
    function toEventObject(event, payload // id?: TEvent['type']
    ) {
      if (isString(event) || typeof event === 'number') {
        return _tslib.__assign({
          type: event
        }, payload);
      }

      return event;
    }
    function toSCXMLEvent(event, scxmlEvent) {
      if (!isString(event) && '$$type' in event && event.$$type === 'scxml') {
        return event;
      }

      var eventObject = toEventObject(event);
      return _tslib.__assign({
        name: eventObject.type,
        data: eventObject,
        $$type: 'scxml',
        type: 'external'
      }, scxmlEvent);
    }
    function toTransitionConfigArray(event, configLike) {
      var transitions = toArrayStrict(configLike).map(function (transitionLike) {
        if (typeof transitionLike === 'undefined' || typeof transitionLike === 'string' || isMachine(transitionLike)) {
          return {
            target: transitionLike,
            event: event
          };
        }

        return _tslib.__assign(_tslib.__assign({}, transitionLike), {
          event: event
        });
      });
      return transitions;
    }
    function normalizeTarget(target) {
      if (target === undefined || target === constants.TARGETLESS_KEY) {
        return undefined;
      }

      return toArray(target);
    }
    function reportUnhandledExceptionOnInvocation(originalError, currentError, id) {
      if (!environment.IS_PRODUCTION) {
        var originalStackTrace = originalError.stack ? " Stacktrace was '".concat(originalError.stack, "'") : '';

        if (originalError === currentError) {
          // tslint:disable-next-line:no-console
          console.error("Missing onError handler for invocation '".concat(id, "', error was '").concat(originalError, "'.").concat(originalStackTrace));
        } else {
          var stackTrace = currentError.stack ? " Stacktrace was '".concat(currentError.stack, "'") : ''; // tslint:disable-next-line:no-console

          console.error("Missing onError handler and/or unhandled exception/promise rejection for invocation '".concat(id, "'. ") + "Original error: '".concat(originalError, "'. ").concat(originalStackTrace, " Current error is '").concat(currentError, "'.").concat(stackTrace));
        }
      }
    }
    function evaluateGuard(machine, guard, context, _event, state) {
      var guards = machine.options.guards;
      var guardMeta = {
        state: state,
        cond: guard,
        _event: _event
      }; // TODO: do not hardcode!

      if (guard.type === constants.DEFAULT_GUARD_TYPE) {
        return ((guards === null || guards === void 0 ? void 0 : guards[guard.name]) || guard.predicate)(context, _event.data, guardMeta);
      }

      var condFn = guards === null || guards === void 0 ? void 0 : guards[guard.type];

      if (!condFn) {
        throw new Error("Guard '".concat(guard.type, "' is not implemented on machine '").concat(machine.id, "'."));
      }

      return condFn(context, _event.data, guardMeta);
    }
    function toInvokeSource(src) {
      if (typeof src === 'string') {
        return {
          type: src
        };
      }

      return src;
    }
    function toObserver(nextHandler, errorHandler, completionHandler) {
      if (typeof nextHandler === 'object') {
        return nextHandler;
      }

      var noop = function () {
        return void 0;
      };

      return {
        next: nextHandler,
        error: errorHandler || noop,
        complete: completionHandler || noop
      };
    }
    function createInvokeId(stateNodeId, index) {
      return "".concat(stateNodeId, ":invocation[").concat(index, "]");
    }

    exports.createInvokeId = createInvokeId;
    exports.evaluateGuard = evaluateGuard;
    exports.flatten = flatten;
    exports.getActionType = getActionType;
    exports.getEventType = getEventType;
    exports.interopSymbols = interopSymbols;
    exports.isActor = isActor;
    exports.isArray = isArray;
    exports.isBehavior = isBehavior;
    exports.isBuiltInEvent = isBuiltInEvent;
    exports.isFunction = isFunction;
    exports.isMachine = isMachine;
    exports.isObservable = isObservable;
    exports.isPromiseLike = isPromiseLike;
    exports.isStateLike = isStateLike;
    exports.isString = isString;
    exports.keys = keys;
    exports.mapContext = mapContext;
    exports.mapFilterValues = mapFilterValues;
    exports.mapValues = mapValues;
    exports.matchesState = matchesState;
    exports.nestedPath = nestedPath;
    exports.normalizeTarget = normalizeTarget;
    exports.partition = partition;
    exports.path = path;
    exports.pathToStateValue = pathToStateValue;
    exports.pathsToStateValue = pathsToStateValue;
    exports.reportUnhandledExceptionOnInvocation = reportUnhandledExceptionOnInvocation;
    exports.symbolObservable = symbolObservable;
    exports.toArray = toArray;
    exports.toArrayStrict = toArrayStrict;
    exports.toEventObject = toEventObject;
    exports.toGuard = toGuard;
    exports.toInvokeSource = toInvokeSource;
    exports.toObserver = toObserver;
    exports.toSCXMLEvent = toSCXMLEvent;
    exports.toStatePath = toStatePath;
    exports.toStatePaths = toStatePaths;
    exports.toStateValue = toStateValue;
    exports.toTransitionConfigArray = toTransitionConfigArray;
    exports.uniqueId = uniqueId;
    exports.updateContext = updateContext;
    exports.updateHistoryStates = updateHistoryStates;
    exports.updateHistoryValue = updateHistoryValue;
    });

    var actionTypes = actionTypes$1;

    var utils$1 = utils$2;

    /*#__PURE__*/utils$1.toSCXMLEvent({
      type: actionTypes.init
    });
    /**
     * Sends an event. This returns an action that will be read by an interpreter to
     * send the event in the next step, after the current step is finished executing.
     *
     * @param event The event to send.
     * @param options Options to pass into the send event:
     *  - `id` - The unique send event identifier (used with `cancel()`).
     *  - `delay` - The number of milliseconds to delay the sending of the event.
     *  - `to` - The target of this event (by default, the machine the event was sent from).
     */

    function send(event, options) {
      return {
        to: options ? options.to : undefined,
        type: actionTypes.send,
        event: utils$1.isFunction(event) ? event : utils$1.toEventObject(event),
        delay: options ? options.delay : undefined,
        id: options && options.id !== undefined ? options.id : utils$1.isFunction(event) ? event.name : utils$1.getEventType(event)
      };
    }
    /**
     * Sends an event to this machine's parent.
     *
     * @param event The event to send to the parent machine.
     * @param options Options to pass into the send event.
     */

    function sendParent(event, options) {
      return send(event, _tslib.__assign(_tslib.__assign({}, options), {
        to: types.SpecialTargets.Parent
      }));
    }
    var sendParent_1 = sendParent;

    const createTimerMachine = (duration) => createMachine({
        initial: 'running',
        context: {
            duration,
            elapsed: 0,
            interval: 1
        },
        states: {
            running: {
                invoke: {
                    src: (context) => (cb) => {
                        const interval = setInterval(() => {
                            cb('TICK');
                        }, 1000 * context.interval);
                        return () => {
                            clearInterval(interval);
                        };
                    }
                },
                on: {
                    '': {
                        target: 'paused',
                        cond: (context) => {
                            return context.elapsed >= context.duration;
                        }
                    },
                    TICK: {
                        actions: assign$1({
                            elapsed: (context) => {
                                return +(context.elapsed + context.interval).toFixed(2);
                            }
                        })
                    }
                }
            },
            paused: {
                entry: [sendParent_1('SHOW_NEXT_POD')],
                on: {
                    '': {
                        target: 'running',
                        cond: (context) => context.elapsed < context.duration
                    }
                }
            }
        },
        on: {
            RESET: {
                actions: assign$1({
                    elapsed: 0
                })
            }
        }
    });

    var bind = function bind(fn, thisArg) {
      return function wrap() {
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i];
        }
        return fn.apply(thisArg, args);
      };
    };

    // utils is a library of generic helper functions non-specific to axios

    var toString = Object.prototype.toString;

    /**
     * Determine if a value is an Array
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an Array, otherwise false
     */
    function isArray(val) {
      return Array.isArray(val);
    }

    /**
     * Determine if a value is undefined
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if the value is undefined, otherwise false
     */
    function isUndefined(val) {
      return typeof val === 'undefined';
    }

    /**
     * Determine if a value is a Buffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Buffer, otherwise false
     */
    function isBuffer(val) {
      return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
        && typeof val.constructor.isBuffer === 'function' && val.constructor.isBuffer(val);
    }

    /**
     * Determine if a value is an ArrayBuffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an ArrayBuffer, otherwise false
     */
    function isArrayBuffer(val) {
      return toString.call(val) === '[object ArrayBuffer]';
    }

    /**
     * Determine if a value is a FormData
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an FormData, otherwise false
     */
    function isFormData(val) {
      return toString.call(val) === '[object FormData]';
    }

    /**
     * Determine if a value is a view on an ArrayBuffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
     */
    function isArrayBufferView(val) {
      var result;
      if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
        result = ArrayBuffer.isView(val);
      } else {
        result = (val) && (val.buffer) && (isArrayBuffer(val.buffer));
      }
      return result;
    }

    /**
     * Determine if a value is a String
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a String, otherwise false
     */
    function isString(val) {
      return typeof val === 'string';
    }

    /**
     * Determine if a value is a Number
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Number, otherwise false
     */
    function isNumber(val) {
      return typeof val === 'number';
    }

    /**
     * Determine if a value is an Object
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an Object, otherwise false
     */
    function isObject(val) {
      return val !== null && typeof val === 'object';
    }

    /**
     * Determine if a value is a plain Object
     *
     * @param {Object} val The value to test
     * @return {boolean} True if value is a plain Object, otherwise false
     */
    function isPlainObject(val) {
      if (toString.call(val) !== '[object Object]') {
        return false;
      }

      var prototype = Object.getPrototypeOf(val);
      return prototype === null || prototype === Object.prototype;
    }

    /**
     * Determine if a value is a Date
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Date, otherwise false
     */
    function isDate(val) {
      return toString.call(val) === '[object Date]';
    }

    /**
     * Determine if a value is a File
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a File, otherwise false
     */
    function isFile(val) {
      return toString.call(val) === '[object File]';
    }

    /**
     * Determine if a value is a Blob
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Blob, otherwise false
     */
    function isBlob(val) {
      return toString.call(val) === '[object Blob]';
    }

    /**
     * Determine if a value is a Function
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Function, otherwise false
     */
    function isFunction(val) {
      return toString.call(val) === '[object Function]';
    }

    /**
     * Determine if a value is a Stream
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Stream, otherwise false
     */
    function isStream(val) {
      return isObject(val) && isFunction(val.pipe);
    }

    /**
     * Determine if a value is a URLSearchParams object
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a URLSearchParams object, otherwise false
     */
    function isURLSearchParams(val) {
      return toString.call(val) === '[object URLSearchParams]';
    }

    /**
     * Trim excess whitespace off the beginning and end of a string
     *
     * @param {String} str The String to trim
     * @returns {String} The String freed of excess whitespace
     */
    function trim(str) {
      return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
    }

    /**
     * Determine if we're running in a standard browser environment
     *
     * This allows axios to run in a web worker, and react-native.
     * Both environments support XMLHttpRequest, but not fully standard globals.
     *
     * web workers:
     *  typeof window -> undefined
     *  typeof document -> undefined
     *
     * react-native:
     *  navigator.product -> 'ReactNative'
     * nativescript
     *  navigator.product -> 'NativeScript' or 'NS'
     */
    function isStandardBrowserEnv() {
      if (typeof navigator !== 'undefined' && (navigator.product === 'ReactNative' ||
                                               navigator.product === 'NativeScript' ||
                                               navigator.product === 'NS')) {
        return false;
      }
      return (
        typeof window !== 'undefined' &&
        typeof document !== 'undefined'
      );
    }

    /**
     * Iterate over an Array or an Object invoking a function for each item.
     *
     * If `obj` is an Array callback will be called passing
     * the value, index, and complete array for each item.
     *
     * If 'obj' is an Object callback will be called passing
     * the value, key, and complete object for each property.
     *
     * @param {Object|Array} obj The object to iterate
     * @param {Function} fn The callback to invoke for each item
     */
    function forEach(obj, fn) {
      // Don't bother if no value provided
      if (obj === null || typeof obj === 'undefined') {
        return;
      }

      // Force an array if not already something iterable
      if (typeof obj !== 'object') {
        /*eslint no-param-reassign:0*/
        obj = [obj];
      }

      if (isArray(obj)) {
        // Iterate over array values
        for (var i = 0, l = obj.length; i < l; i++) {
          fn.call(null, obj[i], i, obj);
        }
      } else {
        // Iterate over object keys
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            fn.call(null, obj[key], key, obj);
          }
        }
      }
    }

    /**
     * Accepts varargs expecting each argument to be an object, then
     * immutably merges the properties of each object and returns result.
     *
     * When multiple objects contain the same key the later object in
     * the arguments list will take precedence.
     *
     * Example:
     *
     * ```js
     * var result = merge({foo: 123}, {foo: 456});
     * console.log(result.foo); // outputs 456
     * ```
     *
     * @param {Object} obj1 Object to merge
     * @returns {Object} Result of all merge properties
     */
    function merge(/* obj1, obj2, obj3, ... */) {
      var result = {};
      function assignValue(val, key) {
        if (isPlainObject(result[key]) && isPlainObject(val)) {
          result[key] = merge(result[key], val);
        } else if (isPlainObject(val)) {
          result[key] = merge({}, val);
        } else if (isArray(val)) {
          result[key] = val.slice();
        } else {
          result[key] = val;
        }
      }

      for (var i = 0, l = arguments.length; i < l; i++) {
        forEach(arguments[i], assignValue);
      }
      return result;
    }

    /**
     * Extends object a by mutably adding to it the properties of object b.
     *
     * @param {Object} a The object to be extended
     * @param {Object} b The object to copy properties from
     * @param {Object} thisArg The object to bind function to
     * @return {Object} The resulting value of object a
     */
    function extend(a, b, thisArg) {
      forEach(b, function assignValue(val, key) {
        if (thisArg && typeof val === 'function') {
          a[key] = bind(val, thisArg);
        } else {
          a[key] = val;
        }
      });
      return a;
    }

    /**
     * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
     *
     * @param {string} content with BOM
     * @return {string} content value without BOM
     */
    function stripBOM(content) {
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
      return content;
    }

    var utils = {
      isArray: isArray,
      isArrayBuffer: isArrayBuffer,
      isBuffer: isBuffer,
      isFormData: isFormData,
      isArrayBufferView: isArrayBufferView,
      isString: isString,
      isNumber: isNumber,
      isObject: isObject,
      isPlainObject: isPlainObject,
      isUndefined: isUndefined,
      isDate: isDate,
      isFile: isFile,
      isBlob: isBlob,
      isFunction: isFunction,
      isStream: isStream,
      isURLSearchParams: isURLSearchParams,
      isStandardBrowserEnv: isStandardBrowserEnv,
      forEach: forEach,
      merge: merge,
      extend: extend,
      trim: trim,
      stripBOM: stripBOM
    };

    function encode(val) {
      return encodeURIComponent(val).
        replace(/%3A/gi, ':').
        replace(/%24/g, '$').
        replace(/%2C/gi, ',').
        replace(/%20/g, '+').
        replace(/%5B/gi, '[').
        replace(/%5D/gi, ']');
    }

    /**
     * Build a URL by appending params to the end
     *
     * @param {string} url The base of the url (e.g., http://www.google.com)
     * @param {object} [params] The params to be appended
     * @returns {string} The formatted url
     */
    var buildURL = function buildURL(url, params, paramsSerializer) {
      /*eslint no-param-reassign:0*/
      if (!params) {
        return url;
      }

      var serializedParams;
      if (paramsSerializer) {
        serializedParams = paramsSerializer(params);
      } else if (utils.isURLSearchParams(params)) {
        serializedParams = params.toString();
      } else {
        var parts = [];

        utils.forEach(params, function serialize(val, key) {
          if (val === null || typeof val === 'undefined') {
            return;
          }

          if (utils.isArray(val)) {
            key = key + '[]';
          } else {
            val = [val];
          }

          utils.forEach(val, function parseValue(v) {
            if (utils.isDate(v)) {
              v = v.toISOString();
            } else if (utils.isObject(v)) {
              v = JSON.stringify(v);
            }
            parts.push(encode(key) + '=' + encode(v));
          });
        });

        serializedParams = parts.join('&');
      }

      if (serializedParams) {
        var hashmarkIndex = url.indexOf('#');
        if (hashmarkIndex !== -1) {
          url = url.slice(0, hashmarkIndex);
        }

        url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
      }

      return url;
    };

    function InterceptorManager() {
      this.handlers = [];
    }

    /**
     * Add a new interceptor to the stack
     *
     * @param {Function} fulfilled The function to handle `then` for a `Promise`
     * @param {Function} rejected The function to handle `reject` for a `Promise`
     *
     * @return {Number} An ID used to remove interceptor later
     */
    InterceptorManager.prototype.use = function use(fulfilled, rejected, options) {
      this.handlers.push({
        fulfilled: fulfilled,
        rejected: rejected,
        synchronous: options ? options.synchronous : false,
        runWhen: options ? options.runWhen : null
      });
      return this.handlers.length - 1;
    };

    /**
     * Remove an interceptor from the stack
     *
     * @param {Number} id The ID that was returned by `use`
     */
    InterceptorManager.prototype.eject = function eject(id) {
      if (this.handlers[id]) {
        this.handlers[id] = null;
      }
    };

    /**
     * Iterate over all the registered interceptors
     *
     * This method is particularly useful for skipping over any
     * interceptors that may have become `null` calling `eject`.
     *
     * @param {Function} fn The function to call for each interceptor
     */
    InterceptorManager.prototype.forEach = function forEach(fn) {
      utils.forEach(this.handlers, function forEachHandler(h) {
        if (h !== null) {
          fn(h);
        }
      });
    };

    var InterceptorManager_1 = InterceptorManager;

    var normalizeHeaderName = function normalizeHeaderName(headers, normalizedName) {
      utils.forEach(headers, function processHeader(value, name) {
        if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
          headers[normalizedName] = value;
          delete headers[name];
        }
      });
    };

    /**
     * Update an Error with the specified config, error code, and response.
     *
     * @param {Error} error The error to update.
     * @param {Object} config The config.
     * @param {string} [code] The error code (for example, 'ECONNABORTED').
     * @param {Object} [request] The request.
     * @param {Object} [response] The response.
     * @returns {Error} The error.
     */
    var enhanceError = function enhanceError(error, config, code, request, response) {
      error.config = config;
      if (code) {
        error.code = code;
      }

      error.request = request;
      error.response = response;
      error.isAxiosError = true;

      error.toJSON = function toJSON() {
        return {
          // Standard
          message: this.message,
          name: this.name,
          // Microsoft
          description: this.description,
          number: this.number,
          // Mozilla
          fileName: this.fileName,
          lineNumber: this.lineNumber,
          columnNumber: this.columnNumber,
          stack: this.stack,
          // Axios
          config: this.config,
          code: this.code,
          status: this.response && this.response.status ? this.response.status : null
        };
      };
      return error;
    };

    var transitional = {
      silentJSONParsing: true,
      forcedJSONParsing: true,
      clarifyTimeoutError: false
    };

    /**
     * Create an Error with the specified message, config, error code, request and response.
     *
     * @param {string} message The error message.
     * @param {Object} config The config.
     * @param {string} [code] The error code (for example, 'ECONNABORTED').
     * @param {Object} [request] The request.
     * @param {Object} [response] The response.
     * @returns {Error} The created error.
     */
    var createError = function createError(message, config, code, request, response) {
      var error = new Error(message);
      return enhanceError(error, config, code, request, response);
    };

    /**
     * Resolve or reject a Promise based on response status.
     *
     * @param {Function} resolve A function that resolves the promise.
     * @param {Function} reject A function that rejects the promise.
     * @param {object} response The response.
     */
    var settle = function settle(resolve, reject, response) {
      var validateStatus = response.config.validateStatus;
      if (!response.status || !validateStatus || validateStatus(response.status)) {
        resolve(response);
      } else {
        reject(createError(
          'Request failed with status code ' + response.status,
          response.config,
          null,
          response.request,
          response
        ));
      }
    };

    var cookies = (
      utils.isStandardBrowserEnv() ?

      // Standard browser envs support document.cookie
        (function standardBrowserEnv() {
          return {
            write: function write(name, value, expires, path, domain, secure) {
              var cookie = [];
              cookie.push(name + '=' + encodeURIComponent(value));

              if (utils.isNumber(expires)) {
                cookie.push('expires=' + new Date(expires).toGMTString());
              }

              if (utils.isString(path)) {
                cookie.push('path=' + path);
              }

              if (utils.isString(domain)) {
                cookie.push('domain=' + domain);
              }

              if (secure === true) {
                cookie.push('secure');
              }

              document.cookie = cookie.join('; ');
            },

            read: function read(name) {
              var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
              return (match ? decodeURIComponent(match[3]) : null);
            },

            remove: function remove(name) {
              this.write(name, '', Date.now() - 86400000);
            }
          };
        })() :

      // Non standard browser env (web workers, react-native) lack needed support.
        (function nonStandardBrowserEnv() {
          return {
            write: function write() {},
            read: function read() { return null; },
            remove: function remove() {}
          };
        })()
    );

    /**
     * Determines whether the specified URL is absolute
     *
     * @param {string} url The URL to test
     * @returns {boolean} True if the specified URL is absolute, otherwise false
     */
    var isAbsoluteURL = function isAbsoluteURL(url) {
      // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
      // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
      // by any combination of letters, digits, plus, period, or hyphen.
      return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
    };

    /**
     * Creates a new URL by combining the specified URLs
     *
     * @param {string} baseURL The base URL
     * @param {string} relativeURL The relative URL
     * @returns {string} The combined URL
     */
    var combineURLs = function combineURLs(baseURL, relativeURL) {
      return relativeURL
        ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
        : baseURL;
    };

    /**
     * Creates a new URL by combining the baseURL with the requestedURL,
     * only when the requestedURL is not already an absolute URL.
     * If the requestURL is absolute, this function returns the requestedURL untouched.
     *
     * @param {string} baseURL The base URL
     * @param {string} requestedURL Absolute or relative URL to combine
     * @returns {string} The combined full path
     */
    var buildFullPath = function buildFullPath(baseURL, requestedURL) {
      if (baseURL && !isAbsoluteURL(requestedURL)) {
        return combineURLs(baseURL, requestedURL);
      }
      return requestedURL;
    };

    // Headers whose duplicates are ignored by node
    // c.f. https://nodejs.org/api/http.html#http_message_headers
    var ignoreDuplicateOf = [
      'age', 'authorization', 'content-length', 'content-type', 'etag',
      'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
      'last-modified', 'location', 'max-forwards', 'proxy-authorization',
      'referer', 'retry-after', 'user-agent'
    ];

    /**
     * Parse headers into an object
     *
     * ```
     * Date: Wed, 27 Aug 2014 08:58:49 GMT
     * Content-Type: application/json
     * Connection: keep-alive
     * Transfer-Encoding: chunked
     * ```
     *
     * @param {String} headers Headers needing to be parsed
     * @returns {Object} Headers parsed into an object
     */
    var parseHeaders = function parseHeaders(headers) {
      var parsed = {};
      var key;
      var val;
      var i;

      if (!headers) { return parsed; }

      utils.forEach(headers.split('\n'), function parser(line) {
        i = line.indexOf(':');
        key = utils.trim(line.substr(0, i)).toLowerCase();
        val = utils.trim(line.substr(i + 1));

        if (key) {
          if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
            return;
          }
          if (key === 'set-cookie') {
            parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
          } else {
            parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
          }
        }
      });

      return parsed;
    };

    var isURLSameOrigin = (
      utils.isStandardBrowserEnv() ?

      // Standard browser envs have full support of the APIs needed to test
      // whether the request URL is of the same origin as current location.
        (function standardBrowserEnv() {
          var msie = /(msie|trident)/i.test(navigator.userAgent);
          var urlParsingNode = document.createElement('a');
          var originURL;

          /**
        * Parse a URL to discover it's components
        *
        * @param {String} url The URL to be parsed
        * @returns {Object}
        */
          function resolveURL(url) {
            var href = url;

            if (msie) {
            // IE needs attribute set twice to normalize properties
              urlParsingNode.setAttribute('href', href);
              href = urlParsingNode.href;
            }

            urlParsingNode.setAttribute('href', href);

            // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
            return {
              href: urlParsingNode.href,
              protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
              host: urlParsingNode.host,
              search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
              hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
              hostname: urlParsingNode.hostname,
              port: urlParsingNode.port,
              pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
                urlParsingNode.pathname :
                '/' + urlParsingNode.pathname
            };
          }

          originURL = resolveURL(window.location.href);

          /**
        * Determine if a URL shares the same origin as the current location
        *
        * @param {String} requestURL The URL to test
        * @returns {boolean} True if URL shares the same origin, otherwise false
        */
          return function isURLSameOrigin(requestURL) {
            var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
            return (parsed.protocol === originURL.protocol &&
                parsed.host === originURL.host);
          };
        })() :

      // Non standard browser envs (web workers, react-native) lack needed support.
        (function nonStandardBrowserEnv() {
          return function isURLSameOrigin() {
            return true;
          };
        })()
    );

    /**
     * A `Cancel` is an object that is thrown when an operation is canceled.
     *
     * @class
     * @param {string=} message The message.
     */
    function Cancel(message) {
      this.message = message;
    }

    Cancel.prototype.toString = function toString() {
      return 'Cancel' + (this.message ? ': ' + this.message : '');
    };

    Cancel.prototype.__CANCEL__ = true;

    var Cancel_1 = Cancel;

    var xhr = function xhrAdapter(config) {
      return new Promise(function dispatchXhrRequest(resolve, reject) {
        var requestData = config.data;
        var requestHeaders = config.headers;
        var responseType = config.responseType;
        var onCanceled;
        function done() {
          if (config.cancelToken) {
            config.cancelToken.unsubscribe(onCanceled);
          }

          if (config.signal) {
            config.signal.removeEventListener('abort', onCanceled);
          }
        }

        if (utils.isFormData(requestData)) {
          delete requestHeaders['Content-Type']; // Let the browser set it
        }

        var request = new XMLHttpRequest();

        // HTTP basic authentication
        if (config.auth) {
          var username = config.auth.username || '';
          var password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : '';
          requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
        }

        var fullPath = buildFullPath(config.baseURL, config.url);
        request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

        // Set the request timeout in MS
        request.timeout = config.timeout;

        function onloadend() {
          if (!request) {
            return;
          }
          // Prepare the response
          var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
          var responseData = !responseType || responseType === 'text' ||  responseType === 'json' ?
            request.responseText : request.response;
          var response = {
            data: responseData,
            status: request.status,
            statusText: request.statusText,
            headers: responseHeaders,
            config: config,
            request: request
          };

          settle(function _resolve(value) {
            resolve(value);
            done();
          }, function _reject(err) {
            reject(err);
            done();
          }, response);

          // Clean up request
          request = null;
        }

        if ('onloadend' in request) {
          // Use onloadend if available
          request.onloadend = onloadend;
        } else {
          // Listen for ready state to emulate onloadend
          request.onreadystatechange = function handleLoad() {
            if (!request || request.readyState !== 4) {
              return;
            }

            // The request errored out and we didn't get a response, this will be
            // handled by onerror instead
            // With one exception: request that using file: protocol, most browsers
            // will return status as 0 even though it's a successful request
            if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
              return;
            }
            // readystate handler is calling before onerror or ontimeout handlers,
            // so we should call onloadend on the next 'tick'
            setTimeout(onloadend);
          };
        }

        // Handle browser request cancellation (as opposed to a manual cancellation)
        request.onabort = function handleAbort() {
          if (!request) {
            return;
          }

          reject(createError('Request aborted', config, 'ECONNABORTED', request));

          // Clean up request
          request = null;
        };

        // Handle low level network errors
        request.onerror = function handleError() {
          // Real errors are hidden from us by the browser
          // onerror should only fire if it's a network error
          reject(createError('Network Error', config, null, request));

          // Clean up request
          request = null;
        };

        // Handle timeout
        request.ontimeout = function handleTimeout() {
          var timeoutErrorMessage = config.timeout ? 'timeout of ' + config.timeout + 'ms exceeded' : 'timeout exceeded';
          var transitional$1 = config.transitional || transitional;
          if (config.timeoutErrorMessage) {
            timeoutErrorMessage = config.timeoutErrorMessage;
          }
          reject(createError(
            timeoutErrorMessage,
            config,
            transitional$1.clarifyTimeoutError ? 'ETIMEDOUT' : 'ECONNABORTED',
            request));

          // Clean up request
          request = null;
        };

        // Add xsrf header
        // This is only done if running in a standard browser environment.
        // Specifically not if we're in a web worker, or react-native.
        if (utils.isStandardBrowserEnv()) {
          // Add xsrf header
          var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ?
            cookies.read(config.xsrfCookieName) :
            undefined;

          if (xsrfValue) {
            requestHeaders[config.xsrfHeaderName] = xsrfValue;
          }
        }

        // Add headers to the request
        if ('setRequestHeader' in request) {
          utils.forEach(requestHeaders, function setRequestHeader(val, key) {
            if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
              // Remove Content-Type if data is undefined
              delete requestHeaders[key];
            } else {
              // Otherwise add header to the request
              request.setRequestHeader(key, val);
            }
          });
        }

        // Add withCredentials to request if needed
        if (!utils.isUndefined(config.withCredentials)) {
          request.withCredentials = !!config.withCredentials;
        }

        // Add responseType to request if needed
        if (responseType && responseType !== 'json') {
          request.responseType = config.responseType;
        }

        // Handle progress if needed
        if (typeof config.onDownloadProgress === 'function') {
          request.addEventListener('progress', config.onDownloadProgress);
        }

        // Not all browsers support upload events
        if (typeof config.onUploadProgress === 'function' && request.upload) {
          request.upload.addEventListener('progress', config.onUploadProgress);
        }

        if (config.cancelToken || config.signal) {
          // Handle cancellation
          // eslint-disable-next-line func-names
          onCanceled = function(cancel) {
            if (!request) {
              return;
            }
            reject(!cancel || (cancel && cancel.type) ? new Cancel_1('canceled') : cancel);
            request.abort();
            request = null;
          };

          config.cancelToken && config.cancelToken.subscribe(onCanceled);
          if (config.signal) {
            config.signal.aborted ? onCanceled() : config.signal.addEventListener('abort', onCanceled);
          }
        }

        if (!requestData) {
          requestData = null;
        }

        // Send the request
        request.send(requestData);
      });
    };

    var DEFAULT_CONTENT_TYPE = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    function setContentTypeIfUnset(headers, value) {
      if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
        headers['Content-Type'] = value;
      }
    }

    function getDefaultAdapter() {
      var adapter;
      if (typeof XMLHttpRequest !== 'undefined') {
        // For browsers use XHR adapter
        adapter = xhr;
      } else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
        // For node use HTTP adapter
        adapter = xhr;
      }
      return adapter;
    }

    function stringifySafely(rawValue, parser, encoder) {
      if (utils.isString(rawValue)) {
        try {
          (parser || JSON.parse)(rawValue);
          return utils.trim(rawValue);
        } catch (e) {
          if (e.name !== 'SyntaxError') {
            throw e;
          }
        }
      }

      return (encoder || JSON.stringify)(rawValue);
    }

    var defaults = {

      transitional: transitional,

      adapter: getDefaultAdapter(),

      transformRequest: [function transformRequest(data, headers) {
        normalizeHeaderName(headers, 'Accept');
        normalizeHeaderName(headers, 'Content-Type');

        if (utils.isFormData(data) ||
          utils.isArrayBuffer(data) ||
          utils.isBuffer(data) ||
          utils.isStream(data) ||
          utils.isFile(data) ||
          utils.isBlob(data)
        ) {
          return data;
        }
        if (utils.isArrayBufferView(data)) {
          return data.buffer;
        }
        if (utils.isURLSearchParams(data)) {
          setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
          return data.toString();
        }
        if (utils.isObject(data) || (headers && headers['Content-Type'] === 'application/json')) {
          setContentTypeIfUnset(headers, 'application/json');
          return stringifySafely(data);
        }
        return data;
      }],

      transformResponse: [function transformResponse(data) {
        var transitional = this.transitional || defaults.transitional;
        var silentJSONParsing = transitional && transitional.silentJSONParsing;
        var forcedJSONParsing = transitional && transitional.forcedJSONParsing;
        var strictJSONParsing = !silentJSONParsing && this.responseType === 'json';

        if (strictJSONParsing || (forcedJSONParsing && utils.isString(data) && data.length)) {
          try {
            return JSON.parse(data);
          } catch (e) {
            if (strictJSONParsing) {
              if (e.name === 'SyntaxError') {
                throw enhanceError(e, this, 'E_JSON_PARSE');
              }
              throw e;
            }
          }
        }

        return data;
      }],

      /**
       * A timeout in milliseconds to abort a request. If set to 0 (default) a
       * timeout is not created.
       */
      timeout: 0,

      xsrfCookieName: 'XSRF-TOKEN',
      xsrfHeaderName: 'X-XSRF-TOKEN',

      maxContentLength: -1,
      maxBodyLength: -1,

      validateStatus: function validateStatus(status) {
        return status >= 200 && status < 300;
      },

      headers: {
        common: {
          'Accept': 'application/json, text/plain, */*'
        }
      }
    };

    utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
      defaults.headers[method] = {};
    });

    utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
    });

    var defaults_1 = defaults;

    /**
     * Transform the data for a request or a response
     *
     * @param {Object|String} data The data to be transformed
     * @param {Array} headers The headers for the request or response
     * @param {Array|Function} fns A single function or Array of functions
     * @returns {*} The resulting transformed data
     */
    var transformData = function transformData(data, headers, fns) {
      var context = this || defaults_1;
      /*eslint no-param-reassign:0*/
      utils.forEach(fns, function transform(fn) {
        data = fn.call(context, data, headers);
      });

      return data;
    };

    var isCancel = function isCancel(value) {
      return !!(value && value.__CANCEL__);
    };

    /**
     * Throws a `Cancel` if cancellation has been requested.
     */
    function throwIfCancellationRequested(config) {
      if (config.cancelToken) {
        config.cancelToken.throwIfRequested();
      }

      if (config.signal && config.signal.aborted) {
        throw new Cancel_1('canceled');
      }
    }

    /**
     * Dispatch a request to the server using the configured adapter.
     *
     * @param {object} config The config that is to be used for the request
     * @returns {Promise} The Promise to be fulfilled
     */
    var dispatchRequest = function dispatchRequest(config) {
      throwIfCancellationRequested(config);

      // Ensure headers exist
      config.headers = config.headers || {};

      // Transform request data
      config.data = transformData.call(
        config,
        config.data,
        config.headers,
        config.transformRequest
      );

      // Flatten headers
      config.headers = utils.merge(
        config.headers.common || {},
        config.headers[config.method] || {},
        config.headers
      );

      utils.forEach(
        ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
        function cleanHeaderConfig(method) {
          delete config.headers[method];
        }
      );

      var adapter = config.adapter || defaults_1.adapter;

      return adapter(config).then(function onAdapterResolution(response) {
        throwIfCancellationRequested(config);

        // Transform response data
        response.data = transformData.call(
          config,
          response.data,
          response.headers,
          config.transformResponse
        );

        return response;
      }, function onAdapterRejection(reason) {
        if (!isCancel(reason)) {
          throwIfCancellationRequested(config);

          // Transform response data
          if (reason && reason.response) {
            reason.response.data = transformData.call(
              config,
              reason.response.data,
              reason.response.headers,
              config.transformResponse
            );
          }
        }

        return Promise.reject(reason);
      });
    };

    /**
     * Config-specific merge-function which creates a new config-object
     * by merging two configuration objects together.
     *
     * @param {Object} config1
     * @param {Object} config2
     * @returns {Object} New object resulting from merging config2 to config1
     */
    var mergeConfig = function mergeConfig(config1, config2) {
      // eslint-disable-next-line no-param-reassign
      config2 = config2 || {};
      var config = {};

      function getMergedValue(target, source) {
        if (utils.isPlainObject(target) && utils.isPlainObject(source)) {
          return utils.merge(target, source);
        } else if (utils.isPlainObject(source)) {
          return utils.merge({}, source);
        } else if (utils.isArray(source)) {
          return source.slice();
        }
        return source;
      }

      // eslint-disable-next-line consistent-return
      function mergeDeepProperties(prop) {
        if (!utils.isUndefined(config2[prop])) {
          return getMergedValue(config1[prop], config2[prop]);
        } else if (!utils.isUndefined(config1[prop])) {
          return getMergedValue(undefined, config1[prop]);
        }
      }

      // eslint-disable-next-line consistent-return
      function valueFromConfig2(prop) {
        if (!utils.isUndefined(config2[prop])) {
          return getMergedValue(undefined, config2[prop]);
        }
      }

      // eslint-disable-next-line consistent-return
      function defaultToConfig2(prop) {
        if (!utils.isUndefined(config2[prop])) {
          return getMergedValue(undefined, config2[prop]);
        } else if (!utils.isUndefined(config1[prop])) {
          return getMergedValue(undefined, config1[prop]);
        }
      }

      // eslint-disable-next-line consistent-return
      function mergeDirectKeys(prop) {
        if (prop in config2) {
          return getMergedValue(config1[prop], config2[prop]);
        } else if (prop in config1) {
          return getMergedValue(undefined, config1[prop]);
        }
      }

      var mergeMap = {
        'url': valueFromConfig2,
        'method': valueFromConfig2,
        'data': valueFromConfig2,
        'baseURL': defaultToConfig2,
        'transformRequest': defaultToConfig2,
        'transformResponse': defaultToConfig2,
        'paramsSerializer': defaultToConfig2,
        'timeout': defaultToConfig2,
        'timeoutMessage': defaultToConfig2,
        'withCredentials': defaultToConfig2,
        'adapter': defaultToConfig2,
        'responseType': defaultToConfig2,
        'xsrfCookieName': defaultToConfig2,
        'xsrfHeaderName': defaultToConfig2,
        'onUploadProgress': defaultToConfig2,
        'onDownloadProgress': defaultToConfig2,
        'decompress': defaultToConfig2,
        'maxContentLength': defaultToConfig2,
        'maxBodyLength': defaultToConfig2,
        'transport': defaultToConfig2,
        'httpAgent': defaultToConfig2,
        'httpsAgent': defaultToConfig2,
        'cancelToken': defaultToConfig2,
        'socketPath': defaultToConfig2,
        'responseEncoding': defaultToConfig2,
        'validateStatus': mergeDirectKeys
      };

      utils.forEach(Object.keys(config1).concat(Object.keys(config2)), function computeConfigValue(prop) {
        var merge = mergeMap[prop] || mergeDeepProperties;
        var configValue = merge(prop);
        (utils.isUndefined(configValue) && merge !== mergeDirectKeys) || (config[prop] = configValue);
      });

      return config;
    };

    var data = {
      "version": "0.26.1"
    };

    var VERSION = data.version;

    var validators$1 = {};

    // eslint-disable-next-line func-names
    ['object', 'boolean', 'number', 'function', 'string', 'symbol'].forEach(function(type, i) {
      validators$1[type] = function validator(thing) {
        return typeof thing === type || 'a' + (i < 1 ? 'n ' : ' ') + type;
      };
    });

    var deprecatedWarnings = {};

    /**
     * Transitional option validator
     * @param {function|boolean?} validator - set to false if the transitional option has been removed
     * @param {string?} version - deprecated version / removed since version
     * @param {string?} message - some message with additional info
     * @returns {function}
     */
    validators$1.transitional = function transitional(validator, version, message) {
      function formatMessage(opt, desc) {
        return '[Axios v' + VERSION + '] Transitional option \'' + opt + '\'' + desc + (message ? '. ' + message : '');
      }

      // eslint-disable-next-line func-names
      return function(value, opt, opts) {
        if (validator === false) {
          throw new Error(formatMessage(opt, ' has been removed' + (version ? ' in ' + version : '')));
        }

        if (version && !deprecatedWarnings[opt]) {
          deprecatedWarnings[opt] = true;
          // eslint-disable-next-line no-console
          console.warn(
            formatMessage(
              opt,
              ' has been deprecated since v' + version + ' and will be removed in the near future'
            )
          );
        }

        return validator ? validator(value, opt, opts) : true;
      };
    };

    /**
     * Assert object's properties type
     * @param {object} options
     * @param {object} schema
     * @param {boolean?} allowUnknown
     */

    function assertOptions(options, schema, allowUnknown) {
      if (typeof options !== 'object') {
        throw new TypeError('options must be an object');
      }
      var keys = Object.keys(options);
      var i = keys.length;
      while (i-- > 0) {
        var opt = keys[i];
        var validator = schema[opt];
        if (validator) {
          var value = options[opt];
          var result = value === undefined || validator(value, opt, options);
          if (result !== true) {
            throw new TypeError('option ' + opt + ' must be ' + result);
          }
          continue;
        }
        if (allowUnknown !== true) {
          throw Error('Unknown option ' + opt);
        }
      }
    }

    var validator = {
      assertOptions: assertOptions,
      validators: validators$1
    };

    var validators = validator.validators;
    /**
     * Create a new instance of Axios
     *
     * @param {Object} instanceConfig The default config for the instance
     */
    function Axios(instanceConfig) {
      this.defaults = instanceConfig;
      this.interceptors = {
        request: new InterceptorManager_1(),
        response: new InterceptorManager_1()
      };
    }

    /**
     * Dispatch a request
     *
     * @param {Object} config The config specific for this request (merged with this.defaults)
     */
    Axios.prototype.request = function request(configOrUrl, config) {
      /*eslint no-param-reassign:0*/
      // Allow for axios('example/url'[, config]) a la fetch API
      if (typeof configOrUrl === 'string') {
        config = config || {};
        config.url = configOrUrl;
      } else {
        config = configOrUrl || {};
      }

      config = mergeConfig(this.defaults, config);

      // Set config.method
      if (config.method) {
        config.method = config.method.toLowerCase();
      } else if (this.defaults.method) {
        config.method = this.defaults.method.toLowerCase();
      } else {
        config.method = 'get';
      }

      var transitional = config.transitional;

      if (transitional !== undefined) {
        validator.assertOptions(transitional, {
          silentJSONParsing: validators.transitional(validators.boolean),
          forcedJSONParsing: validators.transitional(validators.boolean),
          clarifyTimeoutError: validators.transitional(validators.boolean)
        }, false);
      }

      // filter out skipped interceptors
      var requestInterceptorChain = [];
      var synchronousRequestInterceptors = true;
      this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
        if (typeof interceptor.runWhen === 'function' && interceptor.runWhen(config) === false) {
          return;
        }

        synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;

        requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
      });

      var responseInterceptorChain = [];
      this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
        responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
      });

      var promise;

      if (!synchronousRequestInterceptors) {
        var chain = [dispatchRequest, undefined];

        Array.prototype.unshift.apply(chain, requestInterceptorChain);
        chain = chain.concat(responseInterceptorChain);

        promise = Promise.resolve(config);
        while (chain.length) {
          promise = promise.then(chain.shift(), chain.shift());
        }

        return promise;
      }


      var newConfig = config;
      while (requestInterceptorChain.length) {
        var onFulfilled = requestInterceptorChain.shift();
        var onRejected = requestInterceptorChain.shift();
        try {
          newConfig = onFulfilled(newConfig);
        } catch (error) {
          onRejected(error);
          break;
        }
      }

      try {
        promise = dispatchRequest(newConfig);
      } catch (error) {
        return Promise.reject(error);
      }

      while (responseInterceptorChain.length) {
        promise = promise.then(responseInterceptorChain.shift(), responseInterceptorChain.shift());
      }

      return promise;
    };

    Axios.prototype.getUri = function getUri(config) {
      config = mergeConfig(this.defaults, config);
      return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
    };

    // Provide aliases for supported request methods
    utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function(url, config) {
        return this.request(mergeConfig(config || {}, {
          method: method,
          url: url,
          data: (config || {}).data
        }));
      };
    });

    utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function(url, data, config) {
        return this.request(mergeConfig(config || {}, {
          method: method,
          url: url,
          data: data
        }));
      };
    });

    var Axios_1 = Axios;

    /**
     * A `CancelToken` is an object that can be used to request cancellation of an operation.
     *
     * @class
     * @param {Function} executor The executor function.
     */
    function CancelToken(executor) {
      if (typeof executor !== 'function') {
        throw new TypeError('executor must be a function.');
      }

      var resolvePromise;

      this.promise = new Promise(function promiseExecutor(resolve) {
        resolvePromise = resolve;
      });

      var token = this;

      // eslint-disable-next-line func-names
      this.promise.then(function(cancel) {
        if (!token._listeners) return;

        var i;
        var l = token._listeners.length;

        for (i = 0; i < l; i++) {
          token._listeners[i](cancel);
        }
        token._listeners = null;
      });

      // eslint-disable-next-line func-names
      this.promise.then = function(onfulfilled) {
        var _resolve;
        // eslint-disable-next-line func-names
        var promise = new Promise(function(resolve) {
          token.subscribe(resolve);
          _resolve = resolve;
        }).then(onfulfilled);

        promise.cancel = function reject() {
          token.unsubscribe(_resolve);
        };

        return promise;
      };

      executor(function cancel(message) {
        if (token.reason) {
          // Cancellation has already been requested
          return;
        }

        token.reason = new Cancel_1(message);
        resolvePromise(token.reason);
      });
    }

    /**
     * Throws a `Cancel` if cancellation has been requested.
     */
    CancelToken.prototype.throwIfRequested = function throwIfRequested() {
      if (this.reason) {
        throw this.reason;
      }
    };

    /**
     * Subscribe to the cancel signal
     */

    CancelToken.prototype.subscribe = function subscribe(listener) {
      if (this.reason) {
        listener(this.reason);
        return;
      }

      if (this._listeners) {
        this._listeners.push(listener);
      } else {
        this._listeners = [listener];
      }
    };

    /**
     * Unsubscribe from the cancel signal
     */

    CancelToken.prototype.unsubscribe = function unsubscribe(listener) {
      if (!this._listeners) {
        return;
      }
      var index = this._listeners.indexOf(listener);
      if (index !== -1) {
        this._listeners.splice(index, 1);
      }
    };

    /**
     * Returns an object that contains a new `CancelToken` and a function that, when called,
     * cancels the `CancelToken`.
     */
    CancelToken.source = function source() {
      var cancel;
      var token = new CancelToken(function executor(c) {
        cancel = c;
      });
      return {
        token: token,
        cancel: cancel
      };
    };

    var CancelToken_1 = CancelToken;

    /**
     * Syntactic sugar for invoking a function and expanding an array for arguments.
     *
     * Common use case would be to use `Function.prototype.apply`.
     *
     *  ```js
     *  function f(x, y, z) {}
     *  var args = [1, 2, 3];
     *  f.apply(null, args);
     *  ```
     *
     * With `spread` this example can be re-written.
     *
     *  ```js
     *  spread(function(x, y, z) {})([1, 2, 3]);
     *  ```
     *
     * @param {Function} callback
     * @returns {Function}
     */
    var spread = function spread(callback) {
      return function wrap(arr) {
        return callback.apply(null, arr);
      };
    };

    /**
     * Determines whether the payload is an error thrown by Axios
     *
     * @param {*} payload The value to test
     * @returns {boolean} True if the payload is an error thrown by Axios, otherwise false
     */
    var isAxiosError = function isAxiosError(payload) {
      return utils.isObject(payload) && (payload.isAxiosError === true);
    };

    /**
     * Create an instance of Axios
     *
     * @param {Object} defaultConfig The default config for the instance
     * @return {Axios} A new instance of Axios
     */
    function createInstance(defaultConfig) {
      var context = new Axios_1(defaultConfig);
      var instance = bind(Axios_1.prototype.request, context);

      // Copy axios.prototype to instance
      utils.extend(instance, Axios_1.prototype, context);

      // Copy context to instance
      utils.extend(instance, context);

      // Factory for creating new instances
      instance.create = function create(instanceConfig) {
        return createInstance(mergeConfig(defaultConfig, instanceConfig));
      };

      return instance;
    }

    // Create the default instance to be exported
    var axios$1 = createInstance(defaults_1);

    // Expose Axios class to allow class inheritance
    axios$1.Axios = Axios_1;

    // Expose Cancel & CancelToken
    axios$1.Cancel = Cancel_1;
    axios$1.CancelToken = CancelToken_1;
    axios$1.isCancel = isCancel;
    axios$1.VERSION = data.version;

    // Expose all/spread
    axios$1.all = function all(promises) {
      return Promise.all(promises);
    };
    axios$1.spread = spread;

    // Expose isAxiosError
    axios$1.isAxiosError = isAxiosError;

    var axios_1 = axios$1;

    // Allow use of default import syntax in TypeScript
    var _default = axios$1;
    axios_1.default = _default;

    var axios = axios_1;

    const fetchAdFormatDataApi = (url) => axios.get(url).then((response) => response.data);

    const initialContext = {
        adFormatObject: getAdFormatObject(),
    };
    const adMachine = createMachine({
        context: initialContext,
        id: 'ad',
        initial: 'setup',
        states: {
            setup: {
                initial: 'adFormatData',
                states: {
                    adFormatData: {
                        initial: 'init',
                        description: 'An Ad is formed by injecting Ad format data(provided by the UMP system) to the UI template code/system. Ad format data is provided either by injecting directly into the html as a window object or provided as a url link which points to a redis cache, through which we pull the ad format data asynchronously',
                        states: {
                            init: {
                                always: [
                                    {
                                        cond: 'UMP Ad format object present',
                                        target: '#ad.setup.imraid',
                                    },
                                    {
                                        cond: 'UMP Ad format URL present',
                                        target: 'fetch',
                                    },
                                ],
                            },
                            fetch: {
                                invoke: {
                                    id: 'fetchAdFormatData',
                                    src: () => fetchAdFormatDataApi(getAdFormatObjectURL()),
                                    onDone: {
                                        actions: assign$1({
                                            adFormatObject: (_context, event) => event.data,
                                        }),
                                        target: '#ad.setup.imraid',
                                    },
                                    onError: {
                                        target: '#ad.error',
                                    },
                                },
                            },
                        },
                    },
                    imraid: {
                        description: 'IMRAID is an interface for the template code to access native device features and also to interact with the InMobi SDK, this is fundamental for an Ad to be formed',
                        initial: 'init',
                        states: {
                            init: {
                                always: [
                                    {
                                        cond: 'MRAID library is loaded',
                                        target: ['#ad.manager.viewable', '#ad.manager.podManager'],
                                    },
                                    {
                                        cond: 'MRAID library is not loaded',
                                        target: 'load',
                                    },
                                ],
                            },
                            load: {
                                invoke: {
                                    src: () => loadIMRAID(),
                                    id: 'loadIMRAID',
                                    onDone: {
                                        actions: [
                                            'Setup IMRAID error listener',
                                            'Use custom close',
                                            'Disable device close region',
                                            'Disable device back button',
                                            'Hide device status bar',
                                        ],
                                        target: ['#ad.manager'],
                                    },
                                    onError: {
                                        actions: 'Fire InMobi IMRAID load error',
                                        target: '#ad.error',
                                    },
                                },
                            },
                        },
                    },
                },
            },
            manager: {
                initial: 'viewable',
                states: {
                    viewable: {
                        description: 'SDK fetches different responses from the Ad server and initialises them into a webview, onViewable is called when the sdk makes the webview visible to the user, this is a go signal for tempalte code to run the ad etc.',
                        initial: 'init',
                        states: {
                            init: {
                                always: [
                                    {
                                        cond: 'Is viewable',
                                        target: '#ad.manager.podManager',
                                    },
                                    {
                                        cond: 'Is not viewable',
                                        target: 'waiting',
                                    },
                                ],
                            },
                            waiting: {
                                invoke: {
                                    src: (_context, _event) => setupOnViewableListener(),
                                    id: 'waiting',
                                    onDone: {
                                        actions: ['Fire InMobi viewable beacon'],
                                        target: '#ad.manager.podManager',
                                    },
                                },
                            },
                        },
                    },
                    podManager: {
                        entry: assign$1({
                            podMachines: (context, event) => {
                                var _a;
                                return (((_a = context.adFormatObject) === null || _a === void 0 ? void 0 : _a.pods) || []).map((item) => {
                                    return Object.assign(Object.assign({}, item), { ref: spawn(createPodMachine(item), { sync: true }) });
                                });
                            },
                            skipButtonRef: (context, event) => spawn(createSkipButtonMachine(), { sync: true })
                        }),
                        initial: 'polling',
                        states: {
                            polling: {
                                id: 'polling',
                                initial: 'findReadyPod',
                                states: {
                                    findReadyPod: {
                                        invoke: {
                                            src: (context, _event) => new Promise((resolve, reject) => {
                                                var _a, _b;
                                                const readyPod = (_b = (_a = context === null || context === void 0 ? void 0 : context.podMachines) === null || _a === void 0 ? void 0 : _a.find((machine) => {
                                                    var _a, _b;
                                                    return (_b = (_a = machine === null || machine === void 0 ? void 0 : machine.ref) === null || _a === void 0 ? void 0 : _a.getSnapshot()) === null || _b === void 0 ? void 0 : _b.matches('video.video.default.ready');
                                                })) === null || _b === void 0 ? void 0 : _b.ref;
                                                if (readyPod) {
                                                    resolve(readyPod);
                                                }
                                                else {
                                                    reject(null);
                                                }
                                            }),
                                            id: 'findReadyPod',
                                            onDone: {
                                                actions: assign$1({
                                                    currentPod: (_context, event) => event.data,
                                                }),
                                                target: '#ad.manager.podManager.showAd',
                                            },
                                            onError: {
                                                target: 'waiting',
                                            },
                                        },
                                    },
                                    waiting: {
                                        after: [
                                            {
                                                delay: 'Poll Interval',
                                                target: 'findReadyPod',
                                            },
                                        ],
                                    },
                                },
                            },
                            showAd: {
                                entry: [
                                    'Start current pod',
                                    assign$1({
                                        timerRef: (context) => {
                                            var _a, _b, _c, _d, _e, _f;
                                            const DEFAULT_VIDEO_DURATION = 15; // FIXME Move to configs
                                            const videoDuration = ((_f = (_e = (_d = (_c = (_b = (_a = context === null || context === void 0 ? void 0 : context.currentPod) === null || _a === void 0 ? void 0 : _a.ref) === null || _b === void 0 ? void 0 : _b.getSnapshot()) === null || _c === void 0 ? void 0 : _c.context) === null || _d === void 0 ? void 0 : _d.vastData) === null || _e === void 0 ? void 0 : _e.videoData) === null || _f === void 0 ? void 0 : _f.videoDuration) ||
                                                DEFAULT_VIDEO_DURATION;
                                            return spawn(createTimerMachine(videoDuration), {
                                                sync: true,
                                            });
                                        },
                                    }),
                                ],
                                after: [
                                    {
                                        delay: 'Max pod duration',
                                        cond: 'Is First Pod',
                                        actions: [assign$1({
                                                endcardRef: (context, event) => {
                                                    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12;
                                                    return spawn(createEndcardMachine({
                                                        autoClose: ((_a = context === null || context === void 0 ? void 0 : context.adFormatObject) === null || _a === void 0 ? void 0 : _a.autoClose) || false,
                                                        endcardFound: (_f = (_e = (_d = (_c = (_b = context === null || context === void 0 ? void 0 : context.currentPod) === null || _b === void 0 ? void 0 : _b.ref) === null || _c === void 0 ? void 0 : _c.getSnapshot()) === null || _d === void 0 ? void 0 : _d.context) === null || _e === void 0 ? void 0 : _e.vastData) === null || _f === void 0 ? void 0 : _f.endCardFound,
                                                        companionTrackers: ((_l = (_k = (_j = (_h = (_g = context === null || context === void 0 ? void 0 : context.currentPod) === null || _g === void 0 ? void 0 : _g.ref) === null || _h === void 0 ? void 0 : _h.getSnapshot()) === null || _j === void 0 ? void 0 : _j.context) === null || _k === void 0 ? void 0 : _k.vastData) === null || _l === void 0 ? void 0 : _l.companionTrackers) || [],
                                                        endcardCloseDelayInMilliseconds: ((_m = context === null || context === void 0 ? void 0 : context.adFormatObject) === null || _m === void 0 ? void 0 : _m.endCardCloseDelayInMilliseconds) || 1000,
                                                        companionLandingUrl: (_s = (_r = (_q = (_p = (_o = context.currentPod) === null || _o === void 0 ? void 0 : _o.ref) === null || _p === void 0 ? void 0 : _p.getSnapshot()) === null || _q === void 0 ? void 0 : _q.context) === null || _r === void 0 ? void 0 : _r.vastData) === null || _s === void 0 ? void 0 : _s.companionLandingUrl,
                                                        videoLandingUrl: (_x = (_w = (_v = (_u = (_t = context.currentPod) === null || _t === void 0 ? void 0 : _t.ref) === null || _u === void 0 ? void 0 : _u.getSnapshot()) === null || _v === void 0 ? void 0 : _v.context) === null || _w === void 0 ? void 0 : _w.vastData) === null || _x === void 0 ? void 0 : _x.videoLandingUrl,
                                                        endCardImageSrc: (_2 = (_1 = (_0 = (_z = (_y = context.currentPod) === null || _y === void 0 ? void 0 : _y.ref) === null || _z === void 0 ? void 0 : _z.getSnapshot()) === null || _0 === void 0 ? void 0 : _0.context) === null || _1 === void 0 ? void 0 : _1.vastData) === null || _2 === void 0 ? void 0 : _2.endCardImageSrc, endCardIframeResource: (_7 = (_6 = (_5 = (_4 = (_3 = context.currentPod) === null || _3 === void 0 ? void 0 : _3.ref) === null || _4 === void 0 ? void 0 : _4.getSnapshot()) === null || _5 === void 0 ? void 0 : _5.context) === null || _6 === void 0 ? void 0 : _6.vastData) === null || _7 === void 0 ? void 0 : _7.endCardIframeResource, htmlEndCard: (_12 = (_11 = (_10 = (_9 = (_8 = context.currentPod) === null || _8 === void 0 ? void 0 : _8.ref) === null || _9 === void 0 ? void 0 : _9.getSnapshot()) === null || _10 === void 0 ? void 0 : _10.context) === null || _11 === void 0 ? void 0 : _11.vastData) === null || _12 === void 0 ? void 0 : _12.htmlEndCard
                                                    }), { sync: true });
                                                }
                                            })],
                                    },
                                ],
                                on: {
                                    SKIP_POD: {
                                        actions: 'Fire skip video beacon for template pods',
                                        target: 'polling',
                                    },
                                    SKIP_ALL_POD: {
                                        actions: [
                                            'Stop all pods',
                                            'Fire skip all video beacon for template pods',
                                            'Show endcard',
                                        ],
                                    },
                                    SHOW_NEXT_SDK_AD: {
                                        actions: 'Show next sdk pod',
                                    },
                                    SHOW_NEXT_POD: {
                                        target: 'polling',
                                    },
                                    SHOW_END_CARD: {
                                        actions: ['Show endcard'],
                                    },
                                    CLOSE_AD: {
                                        target: 'closeAd',
                                    },
                                },
                            },
                            skipAllButton: {
                                initial: 'init',
                                states: {
                                    init: {
                                        always: [
                                            {
                                                cond: 'Has next Ad',
                                                target: 'show',
                                            },
                                            {
                                                target: 'hide',
                                            },
                                        ],
                                    },
                                    show: {
                                        on: {
                                            HIDE: {
                                                target: 'hide',
                                            },
                                            entry: {},
                                        },
                                    },
                                    hide: {
                                        type: 'final',
                                    },
                                },
                            },
                            closeAd: {},
                        },
                    },
                },
            },
            error: {
                entry: 'Fire InMobi beacon for Ad format data error',
                type: 'final',
            },
            close: {
                entry: 'IMRAID close Ad',
                type: 'final',
            },
        },
    }, {
        actions: AD_MACHINE_ACTIONS,
        guards: AD_MACHINE_GUARDS,
        delays: AD_MACHINE_DELAYS,
    });

    const SKIP_ALL_ICON_ALT_TEXT = "Skip All Icon";

    /* src/components/video/CommonElements.svelte generated by Svelte v3.47.0 */

    const file$1 = "src/components/video/CommonElements.svelte";

    // (23:4) {#if $skipButtonRef?.matches('show')}
    function create_if_block(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element$1("div");
    			img = element$1("img");
    			attr_dev(img, "class", "icons");
    			attr_dev(img, "id", "skipBtnImg");
    			if (!src_url_equal(img.src, img_src_value = SKIP_ICON)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Skip Video");
    			add_location(img, file$1, 24, 8, 581);
    			attr_dev(div, "class", "block-4 iconsToHide");
    			attr_dev(div, "id", "skip-btn");
    			add_location(div, file$1, 23, 6, 525);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);

    			if (!mounted) {
    				dispose = listen_dev(
    					img,
    					"click",
    					function () {
    						if (is_function(/*skipVideo*/ ctx[2])) /*skipVideo*/ ctx[2].apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(23:4) {#if $skipButtonRef?.matches('show')}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div8;
    	let div4;
    	let show_if = /*$skipButtonRef*/ ctx[6]?.matches('show');
    	let t0;
    	let div0;
    	let img0;
    	let img0_src_value;
    	let t1;
    	let div1;
    	let img1;
    	let img1_src_value;
    	let t2;
    	let div3;
    	let div2;
    	let t3_value = (/*elapsed*/ ctx[1] || '00') + "";
    	let t3;
    	let t4;
    	let div7;
    	let div6;
    	let div5;
    	let img2;
    	let img2_src_value;
    	let mounted;
    	let dispose;
    	let if_block = show_if && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div8 = element$1("div");
    			div4 = element$1("div");
    			if (if_block) if_block.c();
    			t0 = space();
    			div0 = element$1("div");
    			img0 = element$1("img");
    			t1 = space();
    			div1 = element$1("div");
    			img1 = element$1("img");
    			t2 = space();
    			div3 = element$1("div");
    			div2 = element$1("div");
    			t3 = text(t3_value);
    			t4 = space();
    			div7 = element$1("div");
    			div6 = element$1("div");
    			div5 = element$1("div");
    			img2 = element$1("img");
    			attr_dev(img0, "class", "icons");
    			attr_dev(img0, "id", "closeBtnImg");
    			if (!src_url_equal(img0.src, img0_src_value = CLOSE_ICON)) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", CLOSE_ICON_ALT_TEXT);
    			add_location(img0, file$1, 34, 6, 819);
    			attr_dev(div0, "class", "block-5 iconsToHide hide");
    			attr_dev(div0, "id", "ecCloseBtn");
    			add_location(div0, file$1, 33, 4, 758);
    			attr_dev(img1, "class", "icons");
    			attr_dev(img1, "id", "skipAllBtnImg");
    			attr_dev(img1, "alt", SKIP_ALL_ICON_ALT_TEXT);
    			if (!src_url_equal(img1.src, img1_src_value = SKIP_ALL_ICON)) attr_dev(img1, "src", img1_src_value);
    			add_location(img1, file$1, 43, 6, 1039);
    			attr_dev(div1, "class", "block-6 iconsToHide hide");
    			attr_dev(div1, "id", "skipAll");
    			add_location(div1, file$1, 42, 4, 981);
    			attr_dev(div2, "id", "timerCount");
    			attr_dev(div2, "class", "timerCount");
    			add_location(div2, file$1, 52, 6, 1270);
    			attr_dev(div3, "id", "timerWrapper");
    			attr_dev(div3, "class", "timerWrapper hide");
    			add_location(div3, file$1, 51, 4, 1214);
    			attr_dev(div4, "id", "skip-close");
    			add_location(div4, file$1, 21, 2, 455);
    			if (!src_url_equal(img2.src, img2_src_value = SPONSORED_AD_CHOICES_ICON)) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", SPONSORED_AD_CHOICES_ICON_ALT_TEXT);
    			add_location(img2, file$1, 58, 8, 1501);
    			attr_dev(div5, "class", "ad_choices_icon");
    			add_location(div5, file$1, 57, 6, 1438);
    			attr_dev(div6, "class", "ad_choices");
    			add_location(div6, file$1, 56, 4, 1407);
    			attr_dev(div7, "id", "sponsored_adChoices");
    			attr_dev(div7, "class", "block-3");
    			add_location(div7, file$1, 55, 2, 1356);
    			attr_dev(div8, "id", "commonElements");
    			add_location(div8, file$1, 20, 0, 427);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div4);
    			if (if_block) if_block.m(div4, null);
    			append_dev(div4, t0);
    			append_dev(div4, div0);
    			append_dev(div0, img0);
    			append_dev(div4, t1);
    			append_dev(div4, div1);
    			append_dev(div1, img1);
    			append_dev(div4, t2);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, t3);
    			append_dev(div8, t4);
    			append_dev(div8, div7);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, img2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(
    						img0,
    						"click",
    						function () {
    							if (is_function(/*closeAd*/ ctx[4])) /*closeAd*/ ctx[4].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						img1,
    						"click",
    						function () {
    							if (is_function(/*skipAllVideo*/ ctx[3])) /*skipAllVideo*/ ctx[3].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						div5,
    						"click",
    						function () {
    							if (is_function(/*openAdChoices*/ ctx[5])) /*openAdChoices*/ ctx[5].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			if (dirty & /*$skipButtonRef*/ 64) show_if = /*$skipButtonRef*/ ctx[6]?.matches('show');

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div4, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*elapsed*/ 2 && t3_value !== (t3_value = (/*elapsed*/ ctx[1] || '00') + "")) set_data_dev(t3, t3_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div8);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $skipButtonRef,
    		$$unsubscribe_skipButtonRef = noop,
    		$$subscribe_skipButtonRef = () => ($$unsubscribe_skipButtonRef(), $$unsubscribe_skipButtonRef = subscribe(skipButtonRef, $$value => $$invalidate(6, $skipButtonRef = $$value)), skipButtonRef);

    	$$self.$$.on_destroy.push(() => $$unsubscribe_skipButtonRef());
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CommonElements', slots, []);
    	let { skipButtonRef } = $$props;
    	validate_store(skipButtonRef, 'skipButtonRef');
    	$$subscribe_skipButtonRef();
    	let { elapsed } = $$props;
    	let { skipVideo } = $$props;
    	let { skipAllVideo } = $$props;
    	let { closeAd } = $$props;
    	let { openAdChoices } = $$props;

    	const writable_props = [
    		'skipButtonRef',
    		'elapsed',
    		'skipVideo',
    		'skipAllVideo',
    		'closeAd',
    		'openAdChoices'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CommonElements> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('skipButtonRef' in $$props) $$subscribe_skipButtonRef($$invalidate(0, skipButtonRef = $$props.skipButtonRef));
    		if ('elapsed' in $$props) $$invalidate(1, elapsed = $$props.elapsed);
    		if ('skipVideo' in $$props) $$invalidate(2, skipVideo = $$props.skipVideo);
    		if ('skipAllVideo' in $$props) $$invalidate(3, skipAllVideo = $$props.skipAllVideo);
    		if ('closeAd' in $$props) $$invalidate(4, closeAd = $$props.closeAd);
    		if ('openAdChoices' in $$props) $$invalidate(5, openAdChoices = $$props.openAdChoices);
    	};

    	$$self.$capture_state = () => ({
    		SKIP_ALL_ICON_ALT_TEXT,
    		CLOSE_ICON,
    		SKIP_ICON,
    		SKIP_ALL_ICON,
    		SPONSORED_AD_CHOICES_ICON,
    		CLOSE_ICON_ALT_TEXT,
    		SPONSORED_AD_CHOICES_ICON_ALT_TEXT,
    		skipButtonRef,
    		elapsed,
    		skipVideo,
    		skipAllVideo,
    		closeAd,
    		openAdChoices,
    		$skipButtonRef
    	});

    	$$self.$inject_state = $$props => {
    		if ('skipButtonRef' in $$props) $$subscribe_skipButtonRef($$invalidate(0, skipButtonRef = $$props.skipButtonRef));
    		if ('elapsed' in $$props) $$invalidate(1, elapsed = $$props.elapsed);
    		if ('skipVideo' in $$props) $$invalidate(2, skipVideo = $$props.skipVideo);
    		if ('skipAllVideo' in $$props) $$invalidate(3, skipAllVideo = $$props.skipAllVideo);
    		if ('closeAd' in $$props) $$invalidate(4, closeAd = $$props.closeAd);
    		if ('openAdChoices' in $$props) $$invalidate(5, openAdChoices = $$props.openAdChoices);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		skipButtonRef,
    		elapsed,
    		skipVideo,
    		skipAllVideo,
    		closeAd,
    		openAdChoices,
    		$skipButtonRef
    	];
    }

    class CommonElements extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init$2(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			skipButtonRef: 0,
    			elapsed: 1,
    			skipVideo: 2,
    			skipAllVideo: 3,
    			closeAd: 4,
    			openAdChoices: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CommonElements",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*skipButtonRef*/ ctx[0] === undefined && !('skipButtonRef' in props)) {
    			console.warn("<CommonElements> was created without expected prop 'skipButtonRef'");
    		}

    		if (/*elapsed*/ ctx[1] === undefined && !('elapsed' in props)) {
    			console.warn("<CommonElements> was created without expected prop 'elapsed'");
    		}

    		if (/*skipVideo*/ ctx[2] === undefined && !('skipVideo' in props)) {
    			console.warn("<CommonElements> was created without expected prop 'skipVideo'");
    		}

    		if (/*skipAllVideo*/ ctx[3] === undefined && !('skipAllVideo' in props)) {
    			console.warn("<CommonElements> was created without expected prop 'skipAllVideo'");
    		}

    		if (/*closeAd*/ ctx[4] === undefined && !('closeAd' in props)) {
    			console.warn("<CommonElements> was created without expected prop 'closeAd'");
    		}

    		if (/*openAdChoices*/ ctx[5] === undefined && !('openAdChoices' in props)) {
    			console.warn("<CommonElements> was created without expected prop 'openAdChoices'");
    		}
    	}

    	get skipButtonRef() {
    		throw new Error("<CommonElements>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set skipButtonRef(value) {
    		throw new Error("<CommonElements>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get elapsed() {
    		throw new Error("<CommonElements>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set elapsed(value) {
    		throw new Error("<CommonElements>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get skipVideo() {
    		throw new Error("<CommonElements>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set skipVideo(value) {
    		throw new Error("<CommonElements>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get skipAllVideo() {
    		throw new Error("<CommonElements>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set skipAllVideo(value) {
    		throw new Error("<CommonElements>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get closeAd() {
    		throw new Error("<CommonElements>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set closeAd(value) {
    		throw new Error("<CommonElements>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get openAdChoices() {
    		throw new Error("<CommonElements>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set openAdChoices(value) {
    		throw new Error("<CommonElements>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/video/Pods.svelte generated by Svelte v3.47.0 */
    const file = "src/components/video/Pods.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (43:2) {#each pods as pod}
    function create_each_block(ctx) {
    	let div;
    	let adpage;
    	let t;
    	let current;

    	adpage = new Adpage({
    			props: {
    				pod: /*pod*/ ctx[9],
    				endcardRef: /*endcardRef*/ ctx[3]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element$1("div");
    			create_component(adpage.$$.fragment);
    			t = space();
    			attr_dev(div, "class", "svelte-u9r2nm");
    			toggle_class(div, "hide", !(/*$service*/ ctx[0]?.context?.currentPod === /*pod*/ ctx[9]?.ref));
    			add_location(div, file, 43, 4, 1109);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(adpage, div, null);
    			append_dev(div, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$service, pods*/ 5) {
    				toggle_class(div, "hide", !(/*$service*/ ctx[0]?.context?.currentPod === /*pod*/ ctx[9]?.ref));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(adpage.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(adpage.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(adpage);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(43:2) {#each pods as pod}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let commonelements;
    	let t;
    	let current;

    	commonelements = new CommonElements({
    			props: {
    				skipButtonRef: /*skipButtonRef*/ ctx[4],
    				skipVideo: /*skipVideo*/ ctx[6],
    				closeAd: /*closeAd*/ ctx[8],
    				skipAllVideo: /*skipAllVideo*/ ctx[7],
    				openAdChoices: /*openAdChoices*/ ctx[5],
    				elapsed: /*$service*/ ctx[0].context?.timerRef?.getSnapshot()?.context?.elapsed
    			},
    			$$inline: true
    		});

    	let each_value = /*pods*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element$1("div");
    			create_component(commonelements.$$.fragment);
    			t = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "id", "ad-cont");
    			attr_dev(div, "class", "ad_hidden");
    			add_location(div, file, 33, 0, 860);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(commonelements, div, null);
    			append_dev(div, t);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const commonelements_changes = {};
    			if (dirty & /*$service*/ 1) commonelements_changes.elapsed = /*$service*/ ctx[0].context?.timerRef?.getSnapshot()?.context?.elapsed;
    			commonelements.$set(commonelements_changes);

    			if (dirty & /*$service, pods, endcardRef*/ 13) {
    				each_value = /*pods*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(commonelements.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(commonelements.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(commonelements);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $service;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Pods', slots, []);
    	const service = interpret(adMachine, { devTools: true });
    	validate_store(service, 'service');
    	component_subscribe($$self, service, value => $$invalidate(0, $service = value));
    	service.start();
    	const pods = $service.context?.podMachines || [];
    	const endcardRef = $service.context?.endcardRef;
    	const skipButtonRef = $service.context?.skipButtonRef;

    	const openAdChoices = () => {
    		openAdChoicesURL($service.context?.adFormatObject?.adChoicesURL || '');
    	};

    	const skipVideo = () => {
    		service.send('SKIP_POD');
    	};

    	const skipAllVideo = () => {
    		service.send('SKIP_ALL_POD');
    	};

    	const closeAd = () => {
    		service.send('END_CARD_CTA_CLICK');
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Pods> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		AdPage: Adpage,
    		interpret,
    		adMachine,
    		CommonElements,
    		service,
    		pods,
    		endcardRef,
    		skipButtonRef,
    		openAdChoicesURL,
    		openAdChoices,
    		skipVideo,
    		skipAllVideo,
    		closeAd,
    		$service
    	});

    	return [
    		$service,
    		service,
    		pods,
    		endcardRef,
    		skipButtonRef,
    		openAdChoices,
    		skipVideo,
    		skipAllVideo,
    		closeAd
    	];
    }

    class Pods extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$2(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Pods",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.47.0 */

    function create_fragment(ctx) {
    	let pods;
    	let current;
    	pods = new Pods({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(pods.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(pods, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(pods.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(pods.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(pods, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Pods });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$2(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __values(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m) return m.call(o);
        if (o && typeof o.length === "number") return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }

    var fastSafeStringify = stringify$1;
    stringify$1.default = stringify$1;
    stringify$1.stable = deterministicStringify;
    stringify$1.stableStringify = deterministicStringify;

    var LIMIT_REPLACE_NODE = '[...]';
    var CIRCULAR_REPLACE_NODE = '[Circular]';

    var arr = [];
    var replacerStack = [];

    function defaultOptions () {
      return {
        depthLimit: Number.MAX_SAFE_INTEGER,
        edgesLimit: Number.MAX_SAFE_INTEGER
      }
    }

    // Regular stringify
    function stringify$1 (obj, replacer, spacer, options) {
      if (typeof options === 'undefined') {
        options = defaultOptions();
      }

      decirc(obj, '', 0, [], undefined, 0, options);
      var res;
      try {
        if (replacerStack.length === 0) {
          res = JSON.stringify(obj, replacer, spacer);
        } else {
          res = JSON.stringify(obj, replaceGetterValues(replacer), spacer);
        }
      } catch (_) {
        return JSON.stringify('[unable to serialize, circular reference is too complex to analyze]')
      } finally {
        while (arr.length !== 0) {
          var part = arr.pop();
          if (part.length === 4) {
            Object.defineProperty(part[0], part[1], part[3]);
          } else {
            part[0][part[1]] = part[2];
          }
        }
      }
      return res
    }

    function setReplace (replace, val, k, parent) {
      var propertyDescriptor = Object.getOwnPropertyDescriptor(parent, k);
      if (propertyDescriptor.get !== undefined) {
        if (propertyDescriptor.configurable) {
          Object.defineProperty(parent, k, { value: replace });
          arr.push([parent, k, val, propertyDescriptor]);
        } else {
          replacerStack.push([val, k, replace]);
        }
      } else {
        parent[k] = replace;
        arr.push([parent, k, val]);
      }
    }

    function decirc (val, k, edgeIndex, stack, parent, depth, options) {
      depth += 1;
      var i;
      if (typeof val === 'object' && val !== null) {
        for (i = 0; i < stack.length; i++) {
          if (stack[i] === val) {
            setReplace(CIRCULAR_REPLACE_NODE, val, k, parent);
            return
          }
        }

        if (
          typeof options.depthLimit !== 'undefined' &&
          depth > options.depthLimit
        ) {
          setReplace(LIMIT_REPLACE_NODE, val, k, parent);
          return
        }

        if (
          typeof options.edgesLimit !== 'undefined' &&
          edgeIndex + 1 > options.edgesLimit
        ) {
          setReplace(LIMIT_REPLACE_NODE, val, k, parent);
          return
        }

        stack.push(val);
        // Optimize for Arrays. Big arrays could kill the performance otherwise!
        if (Array.isArray(val)) {
          for (i = 0; i < val.length; i++) {
            decirc(val[i], i, i, stack, val, depth, options);
          }
        } else {
          var keys = Object.keys(val);
          for (i = 0; i < keys.length; i++) {
            var key = keys[i];
            decirc(val[key], key, i, stack, val, depth, options);
          }
        }
        stack.pop();
      }
    }

    // Stable-stringify
    function compareFunction (a, b) {
      if (a < b) {
        return -1
      }
      if (a > b) {
        return 1
      }
      return 0
    }

    function deterministicStringify (obj, replacer, spacer, options) {
      if (typeof options === 'undefined') {
        options = defaultOptions();
      }

      var tmp = deterministicDecirc(obj, '', 0, [], undefined, 0, options) || obj;
      var res;
      try {
        if (replacerStack.length === 0) {
          res = JSON.stringify(tmp, replacer, spacer);
        } else {
          res = JSON.stringify(tmp, replaceGetterValues(replacer), spacer);
        }
      } catch (_) {
        return JSON.stringify('[unable to serialize, circular reference is too complex to analyze]')
      } finally {
        // Ensure that we restore the object as it was.
        while (arr.length !== 0) {
          var part = arr.pop();
          if (part.length === 4) {
            Object.defineProperty(part[0], part[1], part[3]);
          } else {
            part[0][part[1]] = part[2];
          }
        }
      }
      return res
    }

    function deterministicDecirc (val, k, edgeIndex, stack, parent, depth, options) {
      depth += 1;
      var i;
      if (typeof val === 'object' && val !== null) {
        for (i = 0; i < stack.length; i++) {
          if (stack[i] === val) {
            setReplace(CIRCULAR_REPLACE_NODE, val, k, parent);
            return
          }
        }
        try {
          if (typeof val.toJSON === 'function') {
            return
          }
        } catch (_) {
          return
        }

        if (
          typeof options.depthLimit !== 'undefined' &&
          depth > options.depthLimit
        ) {
          setReplace(LIMIT_REPLACE_NODE, val, k, parent);
          return
        }

        if (
          typeof options.edgesLimit !== 'undefined' &&
          edgeIndex + 1 > options.edgesLimit
        ) {
          setReplace(LIMIT_REPLACE_NODE, val, k, parent);
          return
        }

        stack.push(val);
        // Optimize for Arrays. Big arrays could kill the performance otherwise!
        if (Array.isArray(val)) {
          for (i = 0; i < val.length; i++) {
            deterministicDecirc(val[i], i, i, stack, val, depth, options);
          }
        } else {
          // Create a temporary object in the required way
          var tmp = {};
          var keys = Object.keys(val).sort(compareFunction);
          for (i = 0; i < keys.length; i++) {
            var key = keys[i];
            deterministicDecirc(val[key], key, i, stack, val, depth, options);
            tmp[key] = val[key];
          }
          if (typeof parent !== 'undefined') {
            arr.push([parent, k, val]);
            parent[k] = tmp;
          } else {
            return tmp
          }
        }
        stack.pop();
      }
    }

    // wraps replacer function to handle values we couldn't replace
    // and mark them as replaced value
    function replaceGetterValues (replacer) {
      replacer =
        typeof replacer !== 'undefined'
          ? replacer
          : function (k, v) {
            return v
          };
      return function (key, val) {
        if (replacerStack.length > 0) {
          for (var i = 0; i < replacerStack.length; i++) {
            var part = replacerStack[i];
            if (part[1] === key && part[0] === val) {
              val = part[2];
              replacerStack.splice(i, 1);
              break
            }
          }
        }
        return replacer.call(this, key, val)
      }
    }

    var safeStringify = fastSafeStringify;

    function getLazy(value) {
        return typeof value === 'function' ? value() : value;
    }
    function stringify(value, replacer) {
        try {
            return JSON.stringify(value, replacer);
        }
        catch (e) {
            return safeStringify(value, replacer);
        }
    }

    function selectivelyStringify(value, keys, replacer) {
        var e_1, _a;
        var selected = {};
        try {
            for (var keys_1 = __values(keys), keys_1_1 = keys_1.next(); !keys_1_1.done; keys_1_1 = keys_1.next()) {
                var key = keys_1_1.value;
                selected[key] = value[key];
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (keys_1_1 && !keys_1_1.done && (_a = keys_1.return)) _a.call(keys_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        var serialized = JSON.parse(stringify(selected, replacer));
        return stringify(__assign(__assign({}, value), serialized));
    }
    function stringifyState(state, replacer) {
        return selectivelyStringify(state, ['context', 'event', '_event'], replacer);
    }
    function stringifyMachine(machine, replacer) {
        return selectivelyStringify(machine, ['context'], replacer);
    }

    function createInspectMachine(devTools, options) {
        if (devTools === void 0) { devTools = globalThis.__xstate__; }
        var serviceMap = new Map();
        // Listen for services being registered and index them
        // by their sessionId for quicker lookup
        var sub = devTools.onRegister(function (service) {
            serviceMap.set(service.sessionId, service);
        });
        return createMachine({
            initial: 'pendingConnection',
            context: {
                client: undefined
            },
            states: {
                pendingConnection: {},
                connected: {
                    on: {
                        'service.state': {
                            actions: function (ctx, e) { return ctx.client.send(e); }
                        },
                        'service.event': {
                            actions: function (ctx, e) { return ctx.client.send(e); }
                        },
                        'service.register': {
                            actions: function (ctx, e) { return ctx.client.send(e); }
                        },
                        'service.stop': {
                            actions: function (ctx, e) { return ctx.client.send(e); }
                        },
                        'xstate.event': {
                            actions: function (_, e) {
                                var event = e.event;
                                var scxmlEventObject = JSON.parse(event);
                                var service = serviceMap.get(scxmlEventObject.origin);
                                service === null || service === void 0 ? void 0 : service.send(scxmlEventObject);
                            }
                        },
                        unload: {
                            actions: function (ctx) {
                                ctx.client.send({ type: 'xstate.disconnect' });
                            }
                        },
                        disconnect: 'disconnected'
                    }
                },
                disconnected: {
                    entry: function () {
                        sub.unsubscribe();
                    },
                    type: 'final'
                }
            },
            on: {
                'xstate.inspecting': {
                    target: '.connected',
                    actions: [
                        assign$1({
                            client: function (_, e) { return e.client; }
                        }),
                        function (ctx) {
                            devTools.services.forEach(function (service) {
                                var _a;
                                (_a = ctx.client) === null || _a === void 0 ? void 0 : _a.send({
                                    type: 'service.register',
                                    machine: stringifyMachine(service.machine, options === null || options === void 0 ? void 0 : options.serialize),
                                    state: stringifyState(service.state || service.initialState, options === null || options === void 0 ? void 0 : options.serialize),
                                    sessionId: service.sessionId
                                });
                            });
                        }
                    ]
                }
            }
        });
    }

    var serviceMap = new Map();
    function createDevTools() {
        var services = new Set();
        var serviceListeners = new Set();
        return {
            services: services,
            register: function (service) {
                services.add(service);
                serviceMap.set(service.sessionId, service);
                serviceListeners.forEach(function (listener) { return listener(service); });
                service.onStop(function () {
                    services.delete(service);
                    serviceMap.delete(service.sessionId);
                });
            },
            unregister: function (service) {
                services.delete(service);
                serviceMap.delete(service.sessionId);
            },
            onRegister: function (listener) {
                serviceListeners.add(listener);
                services.forEach(function (service) { return listener(service); });
                return {
                    unsubscribe: function () {
                        serviceListeners.delete(listener);
                    }
                };
            }
        };
    }
    var defaultInspectorOptions = {
        url: 'https://statecharts.io/inspect',
        iframe: function () {
            return document.querySelector('iframe[data-xstate]');
        },
        devTools: function () {
            var devTools = createDevTools();
            globalThis.__xstate__ = devTools;
            return devTools;
        },
        serialize: undefined
    };
    var getFinalOptions = function (options) {
        var withDefaults = __assign(__assign({}, defaultInspectorOptions), options);
        return __assign(__assign({}, withDefaults), { url: new URL(withDefaults.url), iframe: getLazy(withDefaults.iframe), devTools: getLazy(withDefaults.devTools) });
    };
    function inspect(options) {
        var _a = getFinalOptions(options), iframe = _a.iframe, url = _a.url, devTools = _a.devTools;
        if (iframe === null) {
            console.warn('No suitable <iframe> found to embed the inspector. Please pass an <iframe> element to `inspect(iframe)` or create an <iframe data-xstate></iframe> element.');
            return undefined;
        }
        var inspectMachine = createInspectMachine(devTools, options);
        var inspectService = interpret(inspectMachine).start();
        var listeners = new Set();
        var sub = inspectService.subscribe(function (state) {
            listeners.forEach(function (listener) { return listener.next(state); });
        });
        var targetWindow;
        var client;
        var messageHandler = function (event) {
            if (typeof event.data === 'object' &&
                event.data !== null &&
                'type' in event.data) {
                if (iframe && !targetWindow) {
                    targetWindow = iframe.contentWindow;
                }
                if (!client) {
                    client = {
                        send: function (e) {
                            targetWindow.postMessage(e, url.origin);
                        }
                    };
                }
                var inspectEvent = __assign(__assign({}, event.data), { client: client });
                inspectService.send(inspectEvent);
            }
        };
        window.addEventListener('message', messageHandler);
        window.addEventListener('unload', function () {
            inspectService.send({ type: 'unload' });
        });
        var stringifyWithSerializer = function (value) {
            return stringify(value, options === null || options === void 0 ? void 0 : options.serialize);
        };
        devTools.onRegister(function (service) {
            var _a;
            var state = service.state || service.initialState;
            inspectService.send({
                type: 'service.register',
                machine: stringifyMachine(service.machine, options === null || options === void 0 ? void 0 : options.serialize),
                state: stringifyState(state, options === null || options === void 0 ? void 0 : options.serialize),
                sessionId: service.sessionId,
                id: service.id,
                parent: (_a = service.parent) === null || _a === void 0 ? void 0 : _a.sessionId
            });
            inspectService.send({
                type: 'service.event',
                event: stringifyWithSerializer(state._event),
                sessionId: service.sessionId
            });
            // monkey-patch service.send so that we know when an event was sent
            // to a service *before* it is processed, since other events might occur
            // while the sent one is being processed, which throws the order off
            var originalSend = service.send.bind(service);
            service.send = function inspectSend(event, payload) {
                inspectService.send({
                    type: 'service.event',
                    event: stringifyWithSerializer(toSCXMLEvent(toEventObject(event, payload))),
                    sessionId: service.sessionId
                });
                return originalSend(event, payload);
            };
            service.subscribe(function (state) {
                // filter out synchronous notification from within `.start()` call
                // when the `service.state` has not yet been assigned
                if (state === undefined) {
                    return;
                }
                inspectService.send({
                    type: 'service.state',
                    // TODO: investigate usage of structuredClone in browsers if available
                    state: stringifyState(state, options === null || options === void 0 ? void 0 : options.serialize),
                    sessionId: service.sessionId
                });
            });
            service.onStop(function () {
                inspectService.send({
                    type: 'service.stop',
                    sessionId: service.sessionId
                });
            });
        });
        if (iframe) {
            iframe.addEventListener('load', function () {
                targetWindow = iframe.contentWindow;
            });
            iframe.setAttribute('src', String(url));
        }
        else {
            targetWindow = window.open(String(url), 'xstateinspector');
        }
        return {
            send: function (event) {
                inspectService.send(event);
            },
            subscribe: function (next, onError, onComplete) {
                var observer = toObserver(next, onError, onComplete);
                listeners.add(observer);
                observer.next(inspectService.state);
                return {
                    unsubscribe: function () {
                        listeners.delete(observer);
                    }
                };
            },
            disconnect: function () {
                inspectService.send('disconnect');
                window.removeEventListener('message', messageHandler);
                sub.unsubscribe();
            }
        };
    }

    inspect({
        url: "https://statecharts.io/inspect",
        iframe: false
    });
    const app = new App({
        target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
