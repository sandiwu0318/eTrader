async function getStockPrice(){
    const symbol = document.getElementById("symbol").value;
    const frequency = document.getElementById("frequency").value;
    try {
        const res = await fetch(`/api/1.0/stock/getStockPrice?symbol=${symbol}&frequency=${frequency}`);
        const resJson = await res.json();
        const dates = resJson.data.times;
        const prices = resJson.data.prices;
        const volumes = resJson.data.volumes;
        const priceTrace1 = {
            x: dates,
            y: prices,
            mode: "lines",
            type: "scatter",
            name: "price",
            yaxis: "y1"
        };
        console.log(Math.max(...volumes));
        const priceTrace2 = {
            x: dates,
            y: volumes,
            type: "bar",
            name: "Volume",
            yaxis: "y2"
        };
        let priceLayout = {
            title: "Stock price",
            xaxis: {
                title: "Date",
                type: "date",
                rangebreaks: [{
                    pattern: "day of week",
                    bounds: [6, 1]
                }],
            },
            yaxis1: {
                title: "Price",
                side: "left"
            },
            yaxis2: {
                title: "Volume",
                side: "right",
                overlaying: "y",
                range: [0, Math.max(...volumes)*2]
            }
        };
        if (frequency === "1d") {
            priceLayout.xaxis.rangebreaks[0].pattern = "hour";
            priceLayout.xaxis.rangebreaks[0].bounds = [16.1, 9.58];
        }
        const chartData = [priceTrace1, priceTrace2];
        Plotly.newPlot("chart", chartData, priceLayout);
    } catch (err) {
        console.log("price fetch failed, err");
    }

}