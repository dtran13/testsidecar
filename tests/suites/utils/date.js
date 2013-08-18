describe('Date', function() {
	var app;

    beforeEach(function() {
        app = SugarTest.app;
    });

	it("should guess date string formats with seconds", function() {
		var value  = '2012-03-27 01:48:00AM',
			result = app.date.guessFormat(value);
		expect(result).toEqual('Y-m-d h:i:sA');
	});

	it("should guess date string formats without seconds", function() {
		var value  = '2012-03-27 01:48 AM',
			result = app.date.guessFormat(value);
		expect(result).toEqual('Y-m-d h:i A');
	});

	it("should guess date string formats without ampm", function() {
		var value  = '2012-03-27 01:48:58',
			result = app.date.guessFormat(value);
		expect(result).toEqual('Y-m-d H:i:s');
	});

	it("should parse date strings into javascript date objects", function() {
		var result = app.date.parse('2012-03-27 01:48:32');
		expect(result.getDate()).toEqual(27);
		expect(result.getFullYear()).toEqual(2012);
		expect(result.getMonth()).toEqual(2);
		expect(result.getHours()).toEqual(1);
		expect(result.getMinutes()).toEqual(48);
		expect(result.getSeconds()).toEqual(32);
	});

	it("should format date objects into strings", function() {
		var value  = new Date(Date.parse("Tue, 15 May 2012 01:48:00")),
			format = 'Y-m-d H:i:sA',
			result = app.date.format(value, format);
		expect(result).toEqual('2012-05-15 01:48:00AM');

		format = 'Y-m-d H:i:sa';
		result = app.date.format(value, format);
		expect(result).toEqual('2012-05-15 01:48:00am');
	});

	it("should format date objects into strings", function() {
		var value  = '2012-03-27 01:48:32',
			format = 'Y-m-d h:i a',
			result = app.date.parse(value, format);
		expect(result.getDate()).toEqual(27);
		expect(result.getFullYear()).toEqual(2012);
		expect(result.getMonth()).toEqual(2);
		expect(result.getHours()).toEqual(1);
		expect(result.getMinutes()).toEqual(48);
		expect(result.getSeconds()).toEqual(0);// no 's' specified
	});

	it("should format date objects into strings with seconds included", function() {
		var value  = '2012-03-27 01:48:32',
			format = 'Y-m-d h:i:s a',
			result = app.date.parse(value, format);
		expect(result.getDate()).toEqual(27);
		expect(result.getFullYear()).toEqual(2012);
		expect(result.getMonth()).toEqual(2);
		expect(result.getHours()).toEqual(1);
		expect(result.getMinutes()).toEqual(48);
		expect(result.getSeconds()).toEqual(32);// 's' specified
	});

	it("should format date objects into strings modifier backslash", function() {
		var value  = app.date.parse("2012-03-27 01:48:32"),
			format = 'Y-m-d \\at h:i a',
			result = app.date.format(value, format);
		expect(result).toEqual('2012-03-27 at 01:48 am');
	});

	it("should format date objects into strings modifier g", function() {
        var value  = app.date.parse("2012-03-27 01:48:32"),
            format = 'Y-m-d g:i a',
			result = app.date.format(value, format);
		expect(result).toEqual('2012-03-27 1:48 am');
	});

	it("should format date objects into strings modifier j", function() {
        var value  = app.date.parse("2012-03-04 01:48:32"),
            format = 'Y-m-j',
			result = app.date.format(value, format);
		expect(result).toEqual('2012-03-4');
	});

	it("should format date objects into strings modifier n", function() {
        var value  = app.date.parse("2012-03-04 01:48:32"),
            format = 'Y-n-d',
			result = app.date.format(value, format);
		expect(result).toEqual('2012-3-04');
	});

	it("should format even if only time format specified", function() {
        var value  = app.date.parse("2012-03-04 12:00:00"),
            format = 'h:ia',
			result = app.date.format(value, format);
		expect(result).toEqual('12:00pm');
	});
	it("should format 12am with time format specified", function() {
        var value, format, result;

        value = app.date.parse("2012-03-04 00:00:00");
        format = 'h:ia';
		result = app.date.format(value, format);
		expect(result).toEqual('12:00am');
	});
	it("should format date objects given timestamp and no format", function() {
		var result = app.date.parse(1332838080000);
		expect(result.getTime()).toEqual(1332838080000);
	});

	it("should return false if bogus inputs", function() {
		var result = app.date.parse('XyXyZyW');
		expect(result).toEqual(false);
	});

	it("should round time to nearest fifteen minutes", function() {
		var ts     = Date.parse("April 1, 2012 10:01:50"),
			date   = new Date(ts),
			result = app.date.roundTime(date);
		expect(result.getMinutes()).toEqual(15);

		ts     = Date.parse("April 1, 2012 10:16:50");
		date   = new Date(ts);
		result = app.date.roundTime(date);
		expect(result.getMinutes()).toEqual(30);

		ts     = Date.parse("April 1, 2012 10:29:50");
		date   = new Date(ts);
		result = app.date.roundTime(date);
		expect(result.getMinutes()).toEqual(30);

		ts     = Date.parse("April 1, 2012 10:30:50");
		date   = new Date(ts);
		result = app.date.roundTime(date);
		expect(result.getMinutes()).toEqual(30);

		ts     = Date.parse("April 1, 2012 10:31:50");
		date   = new Date(ts);
		result = app.date.roundTime(date);
		expect(result.getMinutes()).toEqual(45);

		ts     = Date.parse("April 1, 2012 10:44:50");
		date   = new Date(ts);
		result = app.date.roundTime(date);
		expect(result.getHours()).toEqual(10);
		expect(result.getMinutes()).toEqual(45);

		ts     = Date.parse("April 1, 2012 10:46:00");
		date   = new Date(ts);
		result = app.date.roundTime(date);
		expect(result.getMinutes()).toEqual(0);
		expect(result.getHours()).toEqual(11);
	});

	it("should convert a UTC date into a local date", function() {
		var date    = new Date("April 1, 2012 10:31:50"),
			offset  = date.getTimezoneOffset(),
			UTC     = new Date("April 1, 2012 10:31:50 UTC");

		if (offset !== 0) {
			expect(date.toString()).not.toEqual(UTC.toString());
			expect(app.date.UTCtoLocalTime(UTC).toString()).not.toEqual(date.toString());
		}
	});

	it("should convert into relative time", function() {
		var ts                      = new Date().getTime(),
			LBL_TIME_AGO_NOW        = new Date(ts - 1*1000),
			LBL_TIME_AGO_SECONDS    = new Date(ts - 10*1000),
			LBL_TIME_AGO_MINUTE     = new Date(ts - 70*1000),
			LBL_TIME_AGO_MINUTES    = new Date(ts - 130*1000),
			LBL_TIME_AGO_HOUR       = new Date(ts - 3610*1000),
			LBL_TIME_AGO_HOURS      = new Date(ts - 7230*1000),
			LBL_TIME_AGO_DAY        = new Date(ts - 90000*1000),
			LBL_TIME_AGO_DAYS       = new Date(ts - 200000*1000),
			LBL_TIME_AGO_YEAR       = new Date(ts - 400*84600*1000);

		//console.log(app.date.getRelativeTimeLabel(LBL_TIME_AGO_SECONDS).str);
		expect(app.date.getRelativeTimeLabel(LBL_TIME_AGO_NOW).str).toEqual("LBL_TIME_AGO_NOW");
		expect(app.date.getRelativeTimeLabel(LBL_TIME_AGO_SECONDS).str).toEqual("LBL_TIME_AGO_SECONDS");
		expect(app.date.getRelativeTimeLabel(LBL_TIME_AGO_MINUTE).str).toEqual("LBL_TIME_AGO_MINUTE");
		expect(app.date.getRelativeTimeLabel(LBL_TIME_AGO_MINUTES).str).toEqual("LBL_TIME_AGO_MINUTES");
		expect(app.date.getRelativeTimeLabel(LBL_TIME_AGO_HOUR).str).toEqual("LBL_TIME_AGO_HOUR");
		expect(app.date.getRelativeTimeLabel(LBL_TIME_AGO_HOURS).str).toEqual("LBL_TIME_AGO_HOURS");
		expect(app.date.getRelativeTimeLabel(LBL_TIME_AGO_DAY).str).toEqual("LBL_TIME_AGO_DAY");
		expect(app.date.getRelativeTimeLabel(LBL_TIME_AGO_DAYS).str).toEqual("LBL_TIME_AGO_DAYS");
		expect(app.date.getRelativeTimeLabel(LBL_TIME_AGO_YEAR).str).toEqual("LBL_TIME_AGO_YEAR");
	});

	it("should parse the format into an object containing each of the format's pieces", function() {
		var dataProvider = [
				{
					formatToParse: "m/d/Y H:i A",
					expected:      {
						month:   "m",
						day:     "d",
						year:    "Y",
						hours:   "H",
						minutes: "i",
						amPm:    "A"
					}
				},
				{
					formatToParse: "Y-m-d h:i:sa",
					expected:      {
						month:   "m",
						day:     "d",
						year:    "Y",
						hours:   "h",
						minutes: "i",
						seconds: "s",
						amPm:    "a"
					}
				}
			],
			actual;

		$.each(dataProvider, function(index, value) {
			actual = app.date.parseFormat(value.formatToParse);
			expect(actual).toEqual(value.expected);
		});
	});

	it("should convert a UTC date into a date according to the specified timezone offset", function() {
		var dateToConvert = new Date("July 12, 2012 10:31:58 am"),
			dataProvider  = [
				{
					timezoneOffset: -7, // PDT
					expected:       {
						month:   6,
						day:     12,
						year:    2012,
						hours:   3,
						minutes: 31,
						seconds: 58
					}
				},
				{
					timezoneOffset: -4, // EDT
					expected:       {
						month:   6,
						day:     12,
						year:    2012,
						hours:   6,
						minutes: 31,
						seconds: 58
					}
				},
				{
					timezoneOffset: 5.5, // ahead of UTC and a float
					expected:       {
						month:   6,
						day:     12,
						year:    2012,
						hours:   16,
						minutes: 1,
						seconds: 58
					}
				}
			],
			actual;

		$.each(dataProvider, function(index, value) {
			actual = app.date.UTCtoTimezone(dateToConvert, value.timezoneOffset);
			expect(actual.getMonth()).toEqual(value.expected.month);
			expect(actual.getDate()).toEqual(value.expected.day);
			expect(actual.getFullYear()).toEqual(value.expected.year);
			expect(actual.getHours()).toEqual(value.expected.hours);
			expect(actual.getMinutes()).toEqual(value.expected.minutes);
			expect(actual.getSeconds()).toEqual(value.expected.seconds);
		});
	});

	it("should return the number of milliseconds since the Unix epoch while assuming the date is UTC", function() {
		var dateToConvert = new Date("July 12, 2012 10:31:58 am"),
			expected      = Date.UTC(
				dateToConvert.getFullYear(),
				dateToConvert.getMonth(),
				dateToConvert.getDate(),
				dateToConvert.getHours(),
				dateToConvert.getMinutes(),
				dateToConvert.getSeconds(),
				dateToConvert.getMilliseconds()
			),
			actual        = app.date.toUTC(dateToConvert);
		expect(actual).toEqual(expected);
	});

	it("should return input if not a date", function() {
		var expected = "asdf",
			actual   = app.date.toUTC(expected);
		expect(actual).toEqual(expected);
	});

    it("should handle falsy displayDefault and also displayDefault with no time part", function() {
        expect(app.date.parseDisplayDefault('now', new Date('August 10, 2012')).getMonth()).toEqual(7);
        expect(app.date.parseDisplayDefault('now', new Date('August 10, 2012')).getDate()).toEqual(10);
        expect(app.date.parseDisplayDefault('now', new Date('August 10, 2012')).getFullYear()).toEqual(2012);
        expect(app.date.parseDisplayDefault("now"+/*no '&' so time part gets ignored*/"01:30am", new Date('August 10, 2012')).getMonth()).toEqual(7);
        expect(app.date.parseDisplayDefault("now"+/*no '&' so time part gets ignored*/"01:30am", new Date('August 10, 2012')).getDate()).toEqual(10);
		expect(app.date.parseDisplayDefault("now"+/*no '&' so time part gets ignored*/"01:30am", new Date('August 10, 2012')).getMinutes()).toEqual(0);
        expect(app.date.parseDisplayDefault('now&01:30am', new Date('August 10, 2012')).getHours()).toEqual(1);
        expect(app.date.parseDisplayDefault('now&01:30am', new Date('August 10, 2012')).getMinutes()).toEqual(30);
        expect(app.date.parseDisplayDefault('now&01:30am', new Date('August 10, 2012')).getDate()).toEqual(10);
        expect(app.date.parseDisplayDefault(null, new Date('August 10, 2012'))).toEqual(null);
        expect(app.date.parseDisplayDefault(undefined, new Date('August 10, 2012'))).toEqual(undefined);
    });
    it("should return now", function() {
        var actual = app.date.parseDisplayDefault('now&01:30am', new Date('August 10, 2012'));
        expect(actual.getFullYear()).toEqual(2012);
        expect(actual.getMonth()).toEqual(7);
        expect(actual.getDate()).toEqual(10);
        expect(actual.getHours()).toEqual(1);
        expect(actual.getMinutes()).toEqual(30);
    });
    it("should return next Monday", function() {
		var actual = app.date.parseDisplayDefault('next monday&01:30am', new Date('August 10, 2012'));
        expect(actual.getFullYear()).toEqual(2012);
        expect(actual.getMonth()).toEqual(7);
        expect(actual.getDate()).toEqual(13);
        expect(actual.getHours()).toEqual(1);
        expect(actual.getMinutes()).toEqual(30);
    });
    it("should return next Friday", function() {
		var actual = app.date.parseDisplayDefault('next friday&01:30am', new Date('January 2, 2012'));
        expect(actual.getFullYear()).toEqual(2012);
        expect(actual.getMonth()).toEqual(0);
        expect(actual.getDate()).toEqual(6);
        expect(actual.getHours()).toEqual(1);
        expect(actual.getMinutes()).toEqual(30);
    });
    it("should return first of next month", function() {
		var actual = app.date.parseDisplayDefault('first day of next month&01:30am', new Date('January 2, 2012'));
        expect(actual.getFullYear()).toEqual(2012);
        expect(actual.getMonth()).toEqual(1);
        expect(actual.getDate()).toEqual(1);
        expect(actual.getHours()).toEqual(1);
        expect(actual.getMinutes()).toEqual(30);
    });
    it("should return first of next month across years", function() {
		var actual = app.date.parseDisplayDefault('first day of next month&01:30am', new Date('December 2, 2012'));
        expect(actual.getFullYear()).toEqual(2013);
        expect(actual.getMonth()).toEqual(0);
        expect(actual.getDate()).toEqual(1);
        expect(actual.getHours()).toEqual(1);
        expect(actual.getMinutes()).toEqual(30);

		actual = app.date.parseDisplayDefault('first day of next month&01:30am', new Date('October 31, 2012'));
        expect(actual.getFullYear()).toEqual(2012);
        expect(actual.getMonth()).toEqual(10);
        expect(actual.getDate()).toEqual(1);
        expect(actual.getHours()).toEqual(1);
        expect(actual.getMinutes()).toEqual(30);
    });
    it("should return -1 day", function() {
		var actual = app.date.parseDisplayDefault('-1 day&01:30am', new Date('January 2, 2012'));
        expect(actual.getFullYear()).toEqual(2012);
        expect(actual.getMonth()).toEqual(0);
        expect(actual.getDate()).toEqual(1);
        expect(actual.getHours()).toEqual(1);
        expect(actual.getMinutes()).toEqual(30);
    });
    it("should return +1 day", function() {
		var actual = app.date.parseDisplayDefault('+1 day&01:30am', new Date('January 2, 2012'));
		//.toEqual("2012-01-03 01:30am");
        expect(actual.getFullYear()).toEqual(2012);
        expect(actual.getMonth()).toEqual(0);
        expect(actual.getDate()).toEqual(3);
        expect(actual.getHours()).toEqual(1);
        expect(actual.getMinutes()).toEqual(30);
    });
    it("should return +1 month when month dates not included in next month", function() {
		var actual = app.date.parseDisplayDefault('+1 month&01:30am', new Date('August 31, 2012'));
        expect(actual.getFullYear()).toEqual(2012);
        expect(actual.getMonth()).toEqual(8);
        expect(actual.getDate()).toEqual(30);
        expect(actual.getHours()).toEqual(1);
        expect(actual.getMinutes()).toEqual(30);
    });
    it("should return +1 month at end of year", function() {
		var actual = app.date.parseDisplayDefault('+1 month&01:30am', new Date('December 31, 2012'));
        expect(actual.getFullYear()).toEqual(2013);
        expect(actual.getMonth()).toEqual(0);
        expect(actual.getDate()).toEqual(31);
        expect(actual.getHours()).toEqual(1);
        expect(actual.getMinutes()).toEqual(30);
    });
    it("should return -1 month when month dates not included in previous month", function() {
		var actual = app.date.parseDisplayDefault('-1 month&01:30am', new Date('October 31, 2012'));
        expect(actual.getFullYear()).toEqual(2012);
        expect(actual.getMonth()).toEqual(8);
        expect(actual.getDate()).toEqual(30);
        expect(actual.getHours()).toEqual(1);
        expect(actual.getMinutes()).toEqual(30);
    });
    it("should return -1 month when at beginning of year", function() {
		var actual = app.date.parseDisplayDefault('-1 month&01:30am', new Date('January 31, 2012'));
		//.toEqual("2011-12-31 01:30am");
        expect(actual.getFullYear()).toEqual(2011);
        expect(actual.getMonth()).toEqual(11);
        expect(actual.getDate()).toEqual(31);
        expect(actual.getHours()).toEqual(1);
        expect(actual.getMinutes()).toEqual(30);
    });
    it("should return 3 months from now and adjust for days not included", function() {
		var actual = app.date.parseDisplayDefault('+3 months&01:30am', new Date('January 31, 2012'));
        expect(actual.getFullYear()).toEqual(2012);
        expect(actual.getMonth()).toEqual(3);
        expect(actual.getDate()).toEqual(30);
        expect(actual.getHours()).toEqual(1);
        expect(actual.getMinutes()).toEqual(30);
    });
    // **Please do not remove.
    // We have found that if you try to add to a Date and the destination is exactly on a DST hour boundary,
    // the results are not as expected. These tests are xit'd as they should only be done
    // in local, per developer tests.
	describe("DST Tests", function() {
		xit("should return 3 months from now across years Munich and also France", function() {
			//Munich: Sunday, March 31, 2013 at 2:00:00 AM clocks are turned forward 1 hour to
			//Sunday, March 31, 2013 at 3:00:00 AM local daylight time instead
			// France too: http://www.timeanddate.com/worldclock/timezone.html?n=195
			var actual = app.date.parseDisplayDefault('+3 months&02:30am', new Date('December 31, 2012'));
			expect(actual.getFullYear()).toEqual(2013);
			expect(actual.getMonth()).toEqual(2);
			expect(actual.getDate()).toEqual(31);
			expect(actual.getHours()).toEqual(1);// one might expect 3 since clocks move forward; but I'm
			// observing that when on DST boundary hour FF / Chrome are truncating back an hour
			expect(actual.getMinutes()).toEqual(30);
		});
		xit("should return 3 months from now across years Portugal", function() {
			//Sunday, March 31, 2013 at 1:00:00 AM clocks are turned forward 1 hour to
			//Sunday, March 31, 2013 at 2:00:00 AM local daylight time instead in Portugal
			var actual = app.date.parseDisplayDefault('+3 months&01:30am', new Date('December 31, 2012'));
			expect(actual.getFullYear()).toEqual(2013);
			expect(actual.getMonth()).toEqual(2);
			expect(actual.getDate()).toEqual(31);
			expect(actual.getHours()).toEqual(0);
			expect(actual.getMinutes()).toEqual(30);
		});
		xit("should return 3 months from now across years in SF,CA", function() {
			//Sunday, March 10, 2013 at 2:00:00 AM clocks are turned forward 1 hour to Sunday, March 10,
			//2013 at 3:00:00 AM local daylight time
			var actual = app.date.parseDisplayDefault('+3 months&02:00am', new Date('December 10, 2012'));
			expect(actual.getFullYear()).toEqual(2013);
			expect(actual.getMonth()).toEqual(2);
			expect(actual.getDate()).toEqual(10);
			expect(actual.getHours()).toEqual(1);// one might expect 3 since clocks move forward; but I'm
			// observing that when on DST boundary hour FF / Chrome are truncating back an hour
			expect(actual.getMinutes()).toEqual(0);
		});
	});
    it("should return 6 months from now", function() {
		var actual = app.date.parseDisplayDefault('+6 months&01:30am', new Date('January 31, 2012'));
        expect(actual.getFullYear()).toEqual(2012);
        expect(actual.getMonth()).toEqual(6);
        expect(actual.getDate()).toEqual(31);
        expect(actual.getHours()).toEqual(1);
        expect(actual.getMinutes()).toEqual(30);
    });
    it("should return 6 months from now across years and also adjsut for days not included", function() {
		var actual = app.date.parseDisplayDefault('+6 months&01:30am', new Date('December 31, 2012'));
        expect(actual.getFullYear()).toEqual(2013);
        expect(actual.getMonth()).toEqual(5);
        expect(actual.getDate()).toEqual(30);
        expect(actual.getHours()).toEqual(1);
        expect(actual.getMinutes()).toEqual(30);
    });
    it("should return arbitrary days away", function() {
		var actual = app.date.parseDisplayDefault('-2 days&01:30am', new Date('October 31, 2012'));
		//.toEqual("2012-10-29 01:30am");
        expect(actual.getFullYear()).toEqual(2012);
        expect(actual.getMonth()).toEqual(9);
        expect(actual.getDate()).toEqual(29);
        expect(actual.getHours()).toEqual(1);
        expect(actual.getMinutes()).toEqual(30);

		actual = app.date.parseDisplayDefault('+2 day&01:30am', new Date('October 31, 2012'));
		//.toEqual("2012-11-02 01:30am");
        expect(actual.getFullYear()).toEqual(2012);
        expect(actual.getMonth()).toEqual(10);
        expect(actual.getDate()).toEqual(2);
        expect(actual.getHours()).toEqual(1);
        expect(actual.getMinutes()).toEqual(30);
    });
    it("should return arbitrary weeks away", function() {
		var actual = app.date.parseDisplayDefault('+2 weeks&01:30am', new Date('August 2, 2012'));
		//.toEqual("2012-08-16 01:30am");
        expect(actual.getFullYear()).toEqual(2012);
        expect(actual.getMonth()).toEqual(7);
        expect(actual.getDate()).toEqual(16);
        expect(actual.getHours()).toEqual(1);
        expect(actual.getMinutes()).toEqual(30);

		actual = app.date.parseDisplayDefault('-2 weeks&01:30am', new Date('August 2, 2012'));
		//.toEqual("2012-07-19 01:30am");
        expect(actual.getFullYear()).toEqual(2012);
        expect(actual.getMonth()).toEqual(6);
        expect(actual.getDate()).toEqual(19);
        expect(actual.getHours()).toEqual(1);
        expect(actual.getMinutes()).toEqual(30);
    });
    it("should return arbitrary months away", function() {
		var actual = app.date.parseDisplayDefault('-2 month&01:30am', new Date('October 31, 2012'));
        expect(actual.getFullYear()).toEqual(2012);
        expect(actual.getMonth()).toEqual(7);
        expect(actual.getDate()).toEqual(31);
        expect(actual.getHours()).toEqual(1);
        expect(actual.getMinutes()).toEqual(30);

		actual = app.date.parseDisplayDefault('+2 month&01:30am', new Date('October 31, 2012'));
        expect(actual.getFullYear()).toEqual(2012);
        expect(actual.getMonth()).toEqual(11);
        expect(actual.getDate()).toEqual(31);
        expect(actual.getHours()).toEqual(1);
        expect(actual.getMinutes()).toEqual(30);
    });
    it("should return arbitrary years away", function() {
		var actual = app.date.parseDisplayDefault('-2 years&01:30am', new Date('October 31, 2012'));
        expect(actual.getFullYear()).toEqual(2010);
        expect(actual.getMonth()).toEqual(9);
        expect(actual.getDate()).toEqual(31);
        expect(actual.getHours()).toEqual(1);
        expect(actual.getMinutes()).toEqual(30);

		actual = app.date.parseDisplayDefault('+2 years&01:30am', new Date('October 31, 2012'));
        expect(actual.getFullYear()).toEqual(2014);
        expect(actual.getMonth()).toEqual(9);
        expect(actual.getDate()).toEqual(31);
        expect(actual.getHours()).toEqual(1);
        expect(actual.getMinutes()).toEqual(30);
    });
    it("should return 1 year from now", function() {
		var actual = app.date.parseDisplayDefault('+1 year&01:30am', new Date('December 31, 2012'));
        expect(actual.getFullYear()).toEqual(2013);
        expect(actual.getMonth()).toEqual(11);
        expect(actual.getDate()).toEqual(31);
        expect(actual.getHours()).toEqual(1);
        expect(actual.getMinutes()).toEqual(30);
    });
    it('should return empty string for non-date value', function() {
        expect(app.date.format('test','Y/m/d')).toEqual('');
    });
    // Datepicker normalization tests
	it('should convert y to yy, Y to yyyy, m to mm, and d to dd', function() {
        expect(app.date.toDatepickerFormat('y/m/d')).toEqual('yy/mm/dd');
        expect(app.date.toDatepickerFormat('Y/m/d')).toEqual('yyyy/mm/dd');
        expect(app.date.toDatepickerFormat('y.m.d')).toEqual('yy.mm.dd');
        expect(app.date.toDatepickerFormat('m-d-Y')).toEqual('mm-dd-yyyy');
        expect(app.date.toDatepickerFormat('')).toEqual('');
        expect(app.date.toDatepickerFormat(null)).toEqual('');
    });
	it("should _stripIsoTZ if stripIsoTZ set true",function() {
        expect(app.date.stripIsoTimeDelimterAndTZ("2012-11-06T20:00:06.651Z")).toEqual("2012-11-06 20:00:06");
        expect(app.date.stripIsoTimeDelimterAndTZ('2012-11-07T04:28:52+00:00')).toEqual("2012-11-07 04:28:52");
	});
	it("should determine if iso 8601 compatible with likely TimeDate values",function() {
        expect(app.date.isIso("2012-11-06T20:00:06.651Z")).toBeTruthy();
		expect(app.date.isIso('2012-12-12T10:35:15-0700')).toBeTruthy();
		expect(app.date.isIso('2012-12-12T09:35:15-0800')).toBeTruthy();
		expect(app.date.isIso('2012-12-12T17:35:15-0000')).toBeTruthy();
		expect(app.date.isIso('2012-12-12T17:35:15+0000')).toBeTruthy();
		expect(app.date.isIso('2012-12-12T17:35:15Z')).toBeTruthy();
		expect(app.date.isIso('2012-12-12')).toBeTruthy();
		expect(app.date.isIso('2012-12-12 17:35:15Z')).toBeTruthy();
		expect(app.date.isIso('2012-12-12 17:35:15')).toBeTruthy();
		expect(app.date.isIso('2012-12-12 17:35')).toBeTruthy();
		expect(app.date.isIso('2012-12-12 17')).toBeTruthy();
		expect(app.date.isIso('xxxx-12-12')).toBeFalsy();
		expect(app.date.isIso('2012-xx-12')).toBeFalsy();
		expect(app.date.isIso('2012-12-xx')).toBeFalsy();
	});

    function createDate(dateString) {
        var date = new Date(),
            pieces = dateString.split(/[-\s:]+/);
        date.setFullYear(pieces[0]);
        date.setMonth(pieces[1] - 1);
        date.setDate(pieces[2]);
        date.setHours(pieces[3]);
        date.setMinutes(pieces[4]);
        date.setSeconds(pieces[5]);
        date.setMilliseconds(0);
        return date;
    }

    it("tests default time parser for 12-hour format with am amd pm", function () {
        var parse = app.date.parse,
            tsFormat = 'h:ia';

        expect(parse("12:00am", tsFormat)).toEqual(createDate('1970-01-01 00:00:00'));
        expect(parse("11:59am", tsFormat)).toEqual(createDate('1970-01-01 11:59:00'));
        expect(parse("01:00am", tsFormat)).toEqual(createDate('1970-01-01 01:00:00'));
        expect(parse("00:00am", tsFormat)).toEqual(createDate('1970-01-01 00:00:00'));
        expect(parse("12:00pm", tsFormat)).toEqual(createDate('1970-01-01 12:00:00'));
        expect(parse("11:59pm", tsFormat)).toEqual(createDate('1970-01-01 23:59:00'));
        expect(parse("00:00pm", tsFormat)).toEqual(createDate('1970-01-01 12:00:00'));
    });

    it("tests default time parser for 24-hour format", function () {
        var parse = app.date.parse,
            tsFormat = 'H:i';

        expect(parse("00:00", tsFormat)).toEqual(createDate('1970-01-01 00:00:00'));
        expect(parse("12:00", tsFormat)).toEqual(createDate('1970-01-01 12:00:00'));
        expect(parse("11:59", tsFormat)).toEqual(createDate('1970-01-01 11:59:00'));
        expect(parse("01:00", tsFormat)).toEqual(createDate('1970-01-01 01:00:00'));
    });

    it ("tests formatting to am amd pm", function () {
        var format = app.date.format,
            tsFormat = 'h:ia',
            date = new Date("Jan 1, 1970 00:00:00").toUTCString().split(/\d\d:/)[0];

        expect(format(new Date(date + ' 00:00:00'), tsFormat)).toEqual('12:00am');
        expect(format(new Date(date + ' 00:01:00'), tsFormat)).toEqual('12:01am');
        expect(format(new Date(date + ' 01:01:00'), tsFormat)).toEqual('01:01am');
        expect(format(new Date(date + ' 12:00:00'), tsFormat)).toEqual('12:00pm');
        expect(format(new Date(date + ' 12:01:00'), tsFormat)).toEqual('12:01pm');
    });
});