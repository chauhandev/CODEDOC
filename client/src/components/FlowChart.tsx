import React from "react";
// @ts-ignores
import Mermaid from "react-mermaid2";

interface FlowChartProps {

  chartDefinition: string;

}
const FlowChart: React.FC<FlowChartProps> = (chartDefinition:any) => {
    console.log(chartDefinition);
    return (
    <div className="p-2 w-auto" >
      <Mermaid chart={chartDefinition.chartDefinition} />
    </div>
  );
};

export default FlowChart;
