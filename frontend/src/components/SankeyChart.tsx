import { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

interface SankeyNode {
  name: string;
}

interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

interface Props {
  nodes: SankeyNode[];
  links: SankeyLink[];
  height?: number;
}

// Color by grade band in the node label
const BAND_COLORS: Record<string, string> = {
  '0-49%': '#ef4444',       // red
  '50-64%': '#f97316',      // orange
  '65-74%': '#eab308',      // yellow
  '75-84%': '#22c55e',      // green
  '85-100%': '#4f46e5',     // indigo
  'Not Submitted': '#94a3b8', // slate
};

function getNodeColor(name: string): string {
  for (const [band, color] of Object.entries(BAND_COLORS)) {
    if (name.includes(band)) return color;
  }
  return '#94a3b8';
}

export default function SankeyChart({ nodes, links, height = 500 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !nodes.length || !links.length) return;

    const nodeColors = nodes.map(n => getNodeColor(n.name));
    const linkColors = links.map(l => {
      const color = getNodeColor(nodes[l.source]?.name || '');
      return color + '30'; // translucent
    });

    Plotly.newPlot(
      containerRef.current,
      [
        {
          type: 'sankey',
          orientation: 'h',
          arrangement: 'snap',
          node: {
            pad: 24,
            thickness: 22,
            line: { color: 'white', width: 1 },
            label: nodes.map(n => n.name.replace('\n', ' — ')),
            color: nodeColors,
            hovertemplate: '%{label}: %{value} students<extra></extra>',
          },
          link: {
            source: links.map(l => l.source),
            target: links.map(l => l.target),
            value: links.map(l => l.value),
            color: linkColors,
            hovertemplate: '%{source.label} → %{target.label}: %{value} students<extra></extra>',
          },
        } as Plotly.Data,
      ],
      {
        font: { family: 'Inter, system-ui, sans-serif', size: 11, color: '#475569' },
        margin: { l: 10, r: 10, t: 10, b: 10 },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        height,
      },
      {
        displayModeBar: false,
        responsive: true,
      }
    );

    return () => {
      if (containerRef.current) {
        Plotly.purge(containerRef.current);
      }
    };
  }, [nodes, links, height]);

  if (!nodes.length || !links.length) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        No data available for Sankey diagram
      </div>
    );
  }

  return <div ref={containerRef} style={{ width: '100%', height }} />;
}
