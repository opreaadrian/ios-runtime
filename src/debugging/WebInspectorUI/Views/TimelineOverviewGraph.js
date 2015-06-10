/*
 * Copyright (C) 2014 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

WebInspector.TimelineOverviewGraph = function (timeline) {
    if (this.constructor === WebInspector.TimelineOverviewGraph) {
        // When instantiated directly return an instance of a type-based concrete subclass.

        console.assert(timeline && timeline instanceof WebInspector.Timeline);

        var timelineType = timeline.type;
        if (timelineType === WebInspector.TimelineRecord.Type.Network) return new WebInspector.NetworkTimelineOverviewGraph(timeline);

        if (timelineType === WebInspector.TimelineRecord.Type.Layout) return new WebInspector.LayoutTimelineOverviewGraph(timeline);

        if (timelineType === WebInspector.TimelineRecord.Type.Script) return new WebInspector.ScriptTimelineOverviewGraph(timeline);

        if (timelineType === WebInspector.TimelineRecord.Type.RenderingFrame) return new WebInspector.RenderingFrameTimelineOverviewGraph(timeline);

        throw Error("Can't make a graph for an unknown timeline.");
    }

    // Concrete object instantiation.
    console.assert(this.constructor !== WebInspector.TimelineOverviewGraph && this instanceof WebInspector.TimelineOverviewGraph);

    // FIXME: Convert this to a WebInspector.Object subclass, and call super().
    // WebInspector.Object.call(this);

    this.element = document.createElement("div");
    this.element.classList.add(WebInspector.TimelineOverviewGraph.StyleClassName);

    this._zeroTime = 0;
    this._startTime = 0;
    this._endTime = 5;
    this._currentTime = 0;
    this._timelineOverview = null;
};

WebInspector.TimelineOverviewGraph.StyleClassName = "timeline-overview-graph";

WebInspector.TimelineOverviewGraph.prototype = Object.defineProperties({
    constructor: WebInspector.TimelineOverviewGraph,
    __proto__: WebInspector.Object.prototype,

    shown: function shown() {
        this._visible = true;
        this.updateLayout();
    },

    hidden: function hidden() {
        this._visible = false;
    },

    reset: function reset() {},

    updateLayout: function updateLayout() {
        if (this._scheduledLayoutUpdateIdentifier) {
            cancelAnimationFrame(this._scheduledLayoutUpdateIdentifier);
            delete this._scheduledLayoutUpdateIdentifier;
        }

        // Implemented by sub-classes if needed.
    },

    updateLayoutIfNeeded: function updateLayoutIfNeeded() {
        if (!this._scheduledLayoutUpdateIdentifier) return;
        this.updateLayout();
    },

    // Protected

    needsLayout: function needsLayout() {
        if (!this._visible) return;

        if (this._scheduledLayoutUpdateIdentifier) return;

        this._scheduledLayoutUpdateIdentifier = requestAnimationFrame(this.updateLayout.bind(this));
    }
}, {
    zeroTime: { // Public

        get: function () {
            return this._zeroTime;
        },
        set: function (x) {
            if (this._zeroTime === x) return;

            this._zeroTime = x || 0;

            this.needsLayout();
        },
        configurable: true,
        enumerable: true
    },
    startTime: {
        get: function () {
            return this._startTime;
        },
        set: function (x) {
            if (this._startTime === x) return;

            this._startTime = x || 0;

            this.needsLayout();
        },
        configurable: true,
        enumerable: true
    },
    endTime: {
        get: function () {
            return this._endTime;
        },
        set: function (x) {
            if (this._endTime === x) return;

            this._endTime = x || 0;

            this.needsLayout();
        },
        configurable: true,
        enumerable: true
    },
    currentTime: {
        get: function () {
            return this._currentTime;
        },
        set: function (x) {
            if (this._currentTime === x) return;

            var oldCurrentTime = this._currentTime;

            this._currentTime = x || 0;

            if (this._startTime <= oldCurrentTime && oldCurrentTime <= this._endTime || this._startTime <= this._currentTime && this._currentTime <= this._endTime) this.needsLayout();
        },
        configurable: true,
        enumerable: true
    },
    timelineOverview: {
        get: function () {
            return this._timelineOverview;
        },
        set: function (x) {
            this._timelineOverview = x;
        },
        configurable: true,
        enumerable: true
    },
    visible: {
        get: function () {
            return this._visible;
        },
        configurable: true,
        enumerable: true
    }
});

// Implemented by sub-classes if needed.