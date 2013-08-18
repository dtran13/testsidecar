/*********************************************************************************
 * The contents of this file are subject to the SugarCRM Master Subscription
 * Agreement (""License"") which can be viewed at
 * http://www.sugarcrm.com/crm/master-subscription-agreement
 * By installing or using this file, You have unconditionally agreed to the
 * terms and conditions of the License, and You may not use this file except in
 * compliance with the License.  Under the terms of the license, You shall not,
 * among other things: 1) sublicense, resell, rent, lease, redistribute, assign
 * or otherwise transfer Your rights to the Software, and 2) use the Software
 * for timesharing or service bureau purposes such as hosting the Software for
 * commercial gain and/or for the benefit of a third party.  Use of the Software
 * may be subject to applicable fees and any use of the Software without first
 * paying applicable fees is strictly prohibited.  You do not have the right to
 * remove SugarCRM copyrights from the source code or user interface.
 *
 * All copies of the Covered Code must include on each user interface screen:
 *  (i) the ""Powered by SugarCRM"" logo and
 *  (ii) the SugarCRM copyright notice
 * in the same form as they appear in the distribution.  See full license for
 * requirements.
 *
 * Your Warranty, Limitations of liability and Indemnity are expressly stated
 * in the License.  Please refer to the License for the specific language
 * governing these rights and limitations under the License.  Portions created
 * by SugarCRM are Copyright (C) 2004-2012 SugarCRM, Inc.; All Rights Reserved.
 ********************************************************************************/
$(function() {

    /**
     * Timeago plugin is a jQuery/Zepto plugin for sidecar that converts a date into a relative time with a timer
     * to keep it relative to now.
     *
     * Example initialization of plugin:
     *
     * $('span.relativetime').timeago({
     *   logger: SUGAR.App.logger,
     *   date: SUGAR.App.date,
     *   lang: SUGAR.App.lang,
     *   template: SUGAR.App.template
     * });
     *
     * This plugin has a hard dependency with SideCar functions. Anyway, if you want to use your own on top of this
     * plugin, make sure that you will have defined:
     *   logger.debug()
     *   date.parse()
     *   date.format()
     *   date.UTCToLocalTime()
     *   date.getRelativeTimeLabel()
     *   lang.get()
     *   template.compile()
     */
    var relativeTimeInterval;
    $.fn.extend({
        timeago:function (options) {
            var self = this, refresh, SugarDate, SugarLog, SugarTemplate, SugarLang;
            options = options || {};

            // required
            if (!options.date || !options.logger || !options.template || !options.lang) return;

            SugarDate = options.date;
            SugarLog = options.logger;
            SugarTemplate = options.template;
            SugarLang = options.lang;

            /**
             * This function pulls the date from the 'title' attribute of the element,
             * converts it in a local date, then gets the relative time and display it.
             */

            refresh = function () {
                var $this = $(this), UTCDate,ctx,
                    formattedDate, formattedTime, relativeTime, relativeTimeTpl, template;

                // REST Api returning ISO 8601 dates so this will be something like "2012-09-06T22:15:00+0000"
                // ISO8601 dates were introduced with ECMAScript v5 - http://kangax.github.com/es5-compat-table/
                var localDate = new Date($this.attr('title')),
                relativeTimeObj = SugarDate.getRelativeTimeLabel(localDate),
                label = ($this.data('label')) ? $this.data('label') : 'LBL_TIME_RELATIVE';

                if (relativeTimeObj.str) {
                    relativeTimeTpl = SugarLang.get(relativeTimeObj.str);
                    relativeTime = SugarTemplate.compile(relativeTimeObj.str, relativeTimeTpl);
                    formattedDate = SugarDate.format(localDate, 'Y/m/d');
                    formattedTime = SugarDate.format(localDate, 'H:i');
                    ctx = {
                        date:formattedDate,
                        time:formattedTime,
                        relativetime:relativeTime(relativeTimeObj.value)
                    };
                    template = SugarTemplate.compile(label, SugarLang.get(label));

                    $this.text(template(ctx));
                }
                return this;
            };

            // Convert all dates
            self.each(refresh);

            // Add a timer to refresh the relative time each minute
            if (self.length > 0) {
                // Check if a timer is already set
                if (!relativeTimeInterval) {
                    SugarLog.debug('(relative time) Starting a timer to convert ' + self.length + ' date');
                } else {
                    clearInterval(relativeTimeInterval);
                }
                // Set a new timer
                relativeTimeInterval = setInterval(function () {
                    self.each(refresh);
                }, 60 * 1000);
            } else if (relativeTimeInterval) {
                SugarLog.debug('(relative time) Stopping the timer as there is no more date to convert');
                clearInterval(relativeTimeInterval);
                relativeTimeInterval = undefined;
            }
            return self;
        }
    });
});
