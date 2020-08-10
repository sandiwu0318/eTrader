const users = [
    {
        email: "test1@gmail.com",
        password: "test1password",
        name: "test1",
        access_token: "test1accesstoken",
        last_login: new Date("2020-01-01"),
        watchlist: "AMZN,TSLA"
    },
    {
        email: "test2@gmail.com",
        password: "test2password",
        name: "test2",
        access_token: "test2accesstoken",
        last_login: new Date("2020-01-01"),
        watchlist: null
    },
    {
        email: "test3@gmail.com",
        password: "test3password",
        name: "test3",
        access_token: "test3accesstoken",
        last_login: new Date("2020-01-01"),
        watchlist: null
    }
];

const orders = [
    {
        user_id: 1,
        symbol: "AMZN",
        volume: 100,
        action: "long",
        sub_action: "buy",
        indicator: "price",
        price: 2879,
        BB: null,
        RSI: null,
        deadline: "2020-09-30",
        success: 0,
        created_date: "2020-08-01"
    },
    {
        user_id: 1,
        symbol: "AMZN",
        volume: 50,
        action: "long",
        sub_action: "sell",
        indicator: "price",
        price: 2879,
        BB: null,
        RSI: null,
        deadline: "2020-09-30",
        success: 0,
        created_date: "2020-08-01"
    },
    {
        user_id: 1,
        symbol: "TSLA",
        volume: 50,
        action: "short",
        sub_action: "short",
        indicator: "BB",
        price: null,
        BB: "lower",
        RSI: null,
        deadline: "2020-09-30",
        success: 0,
        created_date: "2020-08-01"
    },
    {
        user_id: 1,
        symbol: "TSLA",
        volume: 30,
        action: "short",
        sub_action: "short cover",
        indicator: "RSI",
        price: null,
        BB: null,
        RSI: 30,
        deadline: "2020-09-30",
        success: 0,
        created_date: "2020-08-01"
    }
];

const backtestResults = [
    {
        user_id: 1,
        periods: "[\"2020-01-01\", \"2020-07-01\"]",
        symbol: "TSLA",
        volume: 30,
        action: "long",
        indicator: "RSI",
        indicatorPeriod: 6,
        actionValue: 20,
        actionCross: "crossup",
        exitValue: 80,
        exitCross: "crossup",
        investmentReturn: 215,
        ROI: 0.109993,
        created_date: new Date()
    },
    {
        user_id: 1,
        periods: "[\"2020-01-01\", \"2020-07-01\"]",
        symbol: "AMZN",
        volume: 50,
        action: "short",
        indicator: "SMA",
        indicatorPeriod: null,
        actionValue: 6,
        actionCross: "crossup",
        exitValue: 14,
        exitCross: "crossup",
        investmentReturn: 215,
        ROI: 0.109993,
        created_date: new Date()
    }
];

const expectedIndicatorData = {
    "symbol": "AMZN",
    "indicator": "RSI",
    "indicatorPeriod": 6,
    "times": [
        "2020-07-07T16:00:00.000Z",
        "2020-07-08T16:00:00.000Z",
        "2020-07-08T16:00:00.000Z",
        "2020-07-09T16:00:00.000Z",
        "2020-07-12T16:00:00.000Z",
        "2020-07-12T16:00:00.000Z",
        "2020-07-13T16:00:00.000Z",
        "2020-07-14T16:00:00.000Z",
        "2020-07-14T16:00:00.000Z",
        "2020-07-14T16:00:00.000Z"
    ],
    "prices": [
        3081.11,
        3182.63,
        3182.63,
        3200,
        3104,
        3104,
        3084,
        3008.87,
        3008.87,
        3008.87
    ],
    "values": [
        0,
        0,
        0,
        0,
        0,
        0,
        50.62,
        36.58,
        36.58,
        36.58
    ]
};

const expectedBacktestData = {
    "symbol": "AMZN",
    "action": "long",
    "indicator": "SMA",
    "actionValue": 14,
    "exitValue": 6,
    "volume": 100,
    "revenue": 3196.84,
    "cost": 3008.87,
    "investmentReturn": 187.97000000000025,
    "ROI": 0.06247195791110957,
    "data": [
        {
            "time": "2020-07-14T16:00:00.000Z",
            "price": 3008.87,
            "indicatorValue": {
                "actionValue1": 3056.5100000000007,
                "actionValue2": 3053.1016666666656
            },
            "action": "buy"
        },
        {
            "time": "2020-07-19T16:00:00.000Z",
            "price": 3196.84,
            "indicatorValue": {
                "actionValue1": 3076.4857142857154,
                "actionValue2": 3092.0483333333336
            },
            "action": "sell"
        }
    ],
    "chart": {
        "indicator": "SMA",
        "times": [
            "2020-06-24T16:00:00.000Z",
            "2020-06-25T16:00:00.000Z",
            "2020-06-28T16:00:00.000Z",
            "2020-06-29T16:00:00.000Z",
            "2020-06-30T16:00:00.000Z",
            "2020-07-01T16:00:00.000Z",
            "2020-07-05T16:00:00.000Z",
            "2020-07-06T16:00:00.000Z",
            "2020-07-07T16:00:00.000Z",
            "2020-07-08T16:00:00.000Z",
            "2020-07-08T16:00:00.000Z",
            "2020-07-09T16:00:00.000Z",
            "2020-07-12T16:00:00.000Z",
            "2020-07-12T16:00:00.000Z",
            "2020-07-13T16:00:00.000Z",
            "2020-07-14T16:00:00.000Z",
            "2020-07-14T16:00:00.000Z",
            "2020-07-14T16:00:00.000Z",
            "2020-07-15T16:00:00.000Z",
            "2020-07-15T16:00:00.000Z",
            "2020-07-15T16:00:00.000Z",
            "2020-07-16T16:00:00.000Z",
            "2020-07-19T16:00:00.000Z",
            "2020-07-19T16:00:00.000Z",
            "2020-07-19T16:00:00.000Z",
            "2020-07-20T16:00:00.000Z",
            "2020-07-20T16:00:00.000Z",
            "2020-07-21T16:00:00.000Z",
            "2020-07-22T16:00:00.000Z",
            "2020-07-23T16:00:00.000Z"
        ],
        "values": [
            {
                "actionValue1": 0,
                "actionValue2": 0
            },
            {
                "actionValue1": 0,
                "actionValue2": 0
            },
            {
                "actionValue1": 0,
                "actionValue2": 0
            },
            {
                "actionValue1": 0,
                "actionValue2": 0
            },
            {
                "actionValue1": 0,
                "actionValue2": 0
            },
            {
                "actionValue1": 0,
                "actionValue2": 2775.941666666666
            },
            {
                "actionValue1": 0,
                "actionValue2": 2826.351666666666
            },
            {
                "actionValue1": 0,
                "actionValue2": 2877.5599999999995
            },
            {
                "actionValue1": 0,
                "actionValue2": 2944.348333333333
            },
            {
                "actionValue1": 0,
                "actionValue2": 3014.983333333333
            },
            {
                "actionValue1": 0,
                "actionValue2": 3065.638333333333
            },
            {
                "actionValue1": 0,
                "actionValue2": 3117.2549999999997
            },
            {
                "actionValue1": 0,
                "actionValue2": 3125.0816666666665
            },
            {
                "actionValue1": 2969.0842857142857,
                "actionValue2": 3142.395
            },
            {
                "actionValue1": 2992.6142857142854,
                "actionValue2": 3142.8766666666666
            },
            {
                "actionValue1": 3015.1857142857143,
                "actionValue2": 3113.916666666666
            },
            {
                "actionValue1": 3038.649285714286,
                "actionValue2": 3084.9566666666656
            },
            {
                "actionValue1": 3056.5100000000007,
                "actionValue2": 3053.1016666666656
            },
            {
                "actionValue1": 3065.1671428571435,
                "actionValue2": 3035.7516666666656
            },
            {
                "actionValue1": 3072.995714285715,
                "actionValue2": 3018.401666666666
            },
            {
                "actionValue1": 3068.9142857142865,
                "actionValue2": 3004.3849999999998
            },
            {
                "actionValue1": 3066.189285714286,
                "actionValue2": 2996.568333333333
            },
            {
                "actionValue1": 3074.4557142857147,
                "actionValue2": 3027.896666666667
            },
            {
                "actionValue1": 3075.470714285715,
                "actionValue2": 3059.2250000000004
            },
            {
                "actionValue1": 3076.4857142857154,
                "actionValue2": 3092.0483333333336
            },
            {
                "actionValue1": 3072.0778571428586,
                "actionValue2": 3115.1133333333332
            },
            {
                "actionValue1": 3074.527142857144,
                "actionValue2": 3138.1783333333333
            },
            {
                "actionValue1": 3074.2350000000015,
                "actionValue2": 3161.1683333333335
            },
            {
                "actionValue1": 3067.2742857142875,
                "actionValue2": 3126.1200000000003
            },
            {
                "actionValue1": 3067.277142857144,
                "actionValue2": 3094.7983333333336
            }
        ],
        "prices": [
            2754.58,
            2692.87,
            2680.38,
            2758.82,
            2878.7,
            2890.3,
            3057.04,
            3000.12,
            3081.11,
            3182.63,
            3182.63,
            3200,
            3104,
            3104,
            3084,
            3008.87,
            3008.87,
            3008.87,
            2999.9,
            2999.9,
            2999.9,
            2961.97,
            3196.84,
            3196.84,
            3196.84,
            3138.29,
            3138.29,
            3099.91,
            2986.55,
            3008.91
        ],
        "actionCrossIndex": [
            17
        ],
        "exitCrossIndex": [
            24
        ]
    }
};


module.exports = {
    users,
    orders,
    backtestResults,
    expectedIndicatorData,
    expectedBacktestData
};