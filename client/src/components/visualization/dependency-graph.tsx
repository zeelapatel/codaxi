import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

interface Node {
  id: string;
  name: string;
  group: number;
  radius: number;
}

interface Link {
  source: string;
  target: string;
  value: number;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

interface DependencyGraphProps {
  data: GraphData;
  width: number;
  height: number;
}

const DependencyGraph: React.FC<DependencyGraphProps> = ({ data, width, height }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("height", "100%");

    // Define color scale
    const colorScale = d3.scaleOrdinal<number, string>()
      .domain([1, 2, 3, 4, 5])
      .range(["#3f51b5", "#5c6bc0", "#7986cb", "#9fa8da", "#c5cae9"]);

    // Create the links
    const link = svg.append("g")
      .selectAll("line")
      .data(data.links)
      .enter()
      .append("line")
      .attr("stroke", d => d.source === "app.js" ? "#f50057" : "#3f51b5")
      .attr("stroke-width", d => d.source === "app.js" ? 2 : 1)
      .attr("stroke-opacity", d => d.source === "app.js" ? 0.6 : 0.4);

    // Create the nodes
    const node = svg.append("g")
      .selectAll("circle")
      .data(data.nodes)
      .enter()
      .append("circle")
      .attr("r", d => d.radius)
      .attr("fill", d => d.id === "app.js" ? "#f50057" : colorScale(d.group))
      .attr("class", "graph-node")
      .call(d3.drag<SVGCircleElement, Node>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Add node labels
    const labels = svg.append("g")
      .selectAll("text")
      .data(data.nodes)
      .enter()
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("fill", "white")
      .attr("font-size", d => d.radius / 2)
      .text(d => d.name);

    // Create the simulation
    const simulation = d3.forceSimulation<Node, Link>()
      .nodes(data.nodes)
      .force("link", d3.forceLink<Node, Link>()
        .id(d => d.id)
        .links(data.links)
        .distance(100))
      .force("charge", d3.forceManyBody().strength(-100))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .on("tick", ticked);

    // Update positions on each tick
    function ticked() {
      link
        .attr("x1", d => (d.source as any).x)
        .attr("y1", d => (d.source as any).y)
        .attr("x2", d => (d.target as any).x)
        .attr("y2", d => (d.target as any).y);

      node
        .attr("cx", d => d.x = Math.max(d.radius, Math.min(width - d.radius, d.x || 0)))
        .attr("cy", d => d.y = Math.max(d.radius, Math.min(height - d.radius, d.y || 0)));

      labels
        .attr("x", d => d.x || 0)
        .attr("y", d => d.y || 0);
    }

    // Drag functions
    function dragstarted(event: d3.D3DragEvent<SVGCircleElement, Node, Node>) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: d3.D3DragEvent<SVGCircleElement, Node, Node>) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGCircleElement, Node, Node>) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [data, width, height]);

  return (
    <svg ref={svgRef} className="w-full h-full" />
  );
};

export default DependencyGraph;
