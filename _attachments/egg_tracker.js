var root = d3.select(document.body),
        dayPicker = root.append('div').classed('dayPicker', true),
            prevDay = dayPicker.append('a').classed('action', true).classed('dn', true).text("←"),
            dayLabel = dayPicker.append('a').classed('action', true).classed('label', true).text("Today"),
            nextDay = dayPicker.append('a').classed('action', true).classed('up', true).text("→")
        eggCounter = root.append('div').classed('eggCounter', true),
            decCount = eggCounter.append('a').classed('action', true).classed('dn', true).text("-"),
            countDisplay = eggCounter.append('span').classed('value', true).text("0"),
            countLabel = eggCounter.append('span').classed('label', true).text('eggs'),
            incCount = eggCounter.append('a').classed('action', true).classed('up', true).text("+"),
        graph = root.append('svg:svg');


var day = new Date(),
    today = new Date(+day);
function updateDay() {
    var isToday = (+day === +today);
    dayLabel.text( day.getFullYear() + '-' + (day.getMonth()+1) + '-' + day.getDate() );
    nextDay.classed('unavailable', isToday);
    dayLabel.classed('unavailable', isToday);
}
prevDay.on('click', function () {
    day.setDate(day.getDate() - 1);
    updateDay();
});
dayLabel.on('click', function () {
    day.setTime(+today);
    updateDay();
});
nextDay.on('click', function () {
    if (nextDay.classed('unavailable')) return;
    day.setDate(day.getDate() + 1);
    updateDay();
});
updateDay();

var count = 1;
function updateCount() {
    countDisplay.text(count);
    countLabel.text((count === 1) ? "egg" : "eggs");
    decCount.classed('unavailable', count < 1);
}
decCount.on('click', function () {
    if (decCount.classed('unavailable')) return;
    count -= 1;
    updateCount();
});
incCount.on('click', function () {
    count += 1;
    updateCount();
});
updateCount();
