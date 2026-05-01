import { WidgetRegistry } from '../registry.js';
import { renderBars } from './_bar-chart-base.js';

function renderVerticalBarChart(widget) {
    return renderBars(widget, 'vertical');
}

WidgetRegistry.register('vertical_bar_chart', renderVerticalBarChart);
export { renderVerticalBarChart };
