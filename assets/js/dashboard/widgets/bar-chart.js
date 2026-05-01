import { WidgetRegistry } from '../registry.js';
import { renderBars } from './_bar-chart-base.js';

function renderBarChart(widget) {
    return renderBars(widget, 'horizontal');
}

WidgetRegistry.register('bar_chart', renderBarChart);
export { renderBarChart };
