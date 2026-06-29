import React from "react";
import { formatXLM } from "../utils/errorHandler";
import "./AnalyticsDashboard.css";

const METRICS = [
    {
        key: "netFlow",
        label: "Net Flow",
        icon: "⚖️",
        accent: "teal",
        featured: true,
        getValue: (a) => formatXLM(a.netFlow),
        getTrend: (a) => (a.netFlow >= 0 ? "Positive balance" : "Negative balance"),
    },
    {
        key: "totalReceived",
        label: "Total Received",
        icon: "↓",
        accent: "green",
        featured: true,
        getValue: (a) => formatXLM(a.totalReceived),
        getTrend: () => "Incoming XLM",
    },
    {
        key: "totalSent",
        label: "Total Sent",
        icon: "↑",
        accent: "slate",
        featured: true,
        getValue: (a) => formatXLM(a.totalSent),
        getTrend: () => "Outgoing XLM",
    },
    {
        key: "transactionCount",
        label: "Transactions",
        icon: "📋",
        accent: "blue",
        getValue: (a) => a.transactionCount,
        getTrend: () => "All time",
    },
    {
        key: "avgTransaction",
        label: "Average",
        icon: "📊",
        accent: "violet",
        getValue: (a) => formatXLM(a.avgTransaction),
        getTrend: () => "Per payment",
    },
    {
        key: "largestTransaction",
        label: "Largest",
        icon: "🏆",
        accent: "amber",
        getValue: (a) => formatXLM(a.largestTransaction),
        getTrend: () => "Single payment",
    },
];

export default function AnalyticsDashboard({ analytics }) {
    if (!analytics) return null;

    const featured = METRICS.filter((m) => m.featured);
    const secondary = METRICS.filter((m) => !m.featured);

    return (
        <div className="analytics-dashboard">
            <div className="analytics-featured">
                {featured.map((metric) => (
                    <div
                        key={metric.key}
                        className={`analytics-card featured accent-${metric.accent}`}
                    >
                        <div className="card-icon-wrap">{metric.icon}</div>
                        <div className="card-body">
                            <span className="card-label">{metric.label}</span>
                            <div className={`card-value${metric.key === "netFlow" && analytics.netFlow < 0 ? " negative" : ""}`}>
                                {metric.getValue(analytics)}
                            </div>
                            <span className="card-trend">{metric.getTrend(analytics)}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="analytics-secondary">
                {secondary.map((metric) => (
                    <div
                        key={metric.key}
                        className={`analytics-card compact accent-${metric.accent}`}
                    >
                        <div className="card-icon-wrap small">{metric.icon}</div>
                        <div className="card-body">
                            <span className="card-label">{metric.label}</span>
                            <div className="card-value">{metric.getValue(analytics)}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
