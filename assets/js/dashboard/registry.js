const renderers = new Map();

export const WidgetRegistry = {
    register(type, fn) {
        renderers.set(type, fn);
    },

    render(widget) {
        const fn = renderers.get(widget.type);
        if (!fn) {
            const err = document.createElement('p');
            err.textContent = `Unknown widget type: ${widget.type}`;
            return err;
        }
        return fn(widget);
    },

    has(type) {
        return renderers.has(type);
    },
};
