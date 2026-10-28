// This document utilizes Apex charts. If you plan on changing how the pie charts look, you can do it here. Apex charts docs can be found here: https://apexcharts.com/docs/

// I am currently forced to do clientside for this module due to how apexcharts supports react.
"use client";

import Chart from "react-apexcharts";
import { Component } from "react";

class Statistics extends Component {
  constructor(props) {
    super(props);

    let useRegiLogic = props.useRegiLogic;
    let milpacArray = props.milpacArray;
    let billetIDs = props.billetIDs;
    let labelArray = props.labelArray;
    let piechartData = [];
    let combinedArray = Array(billetIDs.length)
      .fill()
      .map(() => []);
    let centerLabel = props.centerLabel;

    for (let milpacIdCombat in milpacArray[0].combat.profiles) {
      var primary = milpacArray[0].combat.profiles[milpacIdCombat].primary;
      if (!primary) continue;

      for (let billetIdArray in billetIDs) {
        if (billetIDs[billetIdArray].includes(primary.positionId)) {
          combinedArray[billetIdArray].push(primary.positionTitle);
        }
      }
    }

    combinedArray.forEach((subArray) => {
      piechartData.push(subArray.length);
    });

    if (useRegiLogic !== true) {
      this.state = {
        options: {
          labels: labelArray,
          legend: {
            show: false,
          },
          dataLabels: {
            enabled: false,
          },
          tooltip: {
            enabled: false,
          },
          stroke: {
            curve: ["smooth", "monotoneCubic"],
            colors: ["#222222"],
            width: 1.5,
          },
          colors: [
            "#109640",
            "#b61217",
            "#2a487c",
            "#ebc729",
            "#e68c08",
            "#7b3fa0",
            "#5bcefa",
            "#f7a8b8",
            "#2ca089",
            "#8b5a2b",
            "#1565c0",
          ],
          plotOptions: {
            pie: {
              donut: {
                size: "85%",
                background: "transparent",
                labels: {
                  fontFamily: "Segoe UI",
                  show: true,
                  name: {
                    fontFamily: "Segoe UI",
                  },
                  value: {
                    fontFamily: "Segoe UI",
                    fontWeight: "bold",
                    color: "#a1a1a1",
                  },
                  total: {
                    color: "#f1f1f1",
                    show: true,
                    showAlways: false,
                    label: centerLabel,
                    fontFamily: "Segoe UI",
                    fontWeight: "bold",
                  },
                },
              },
            },
          },
        },
        series: piechartData,
      };
    } else if (useRegiLogic === true) {
      this.state = {
        options: {
          labels: labelArray,
          legend: {
            show: false,
          },
          dataLabels: {
            enabled: false,
          },
          tooltip: {
            enabled: false,
          },
          stroke: {
            curve: ["smooth", "monotoneCubic"],
            colors: ["#222222"],
            width: 1.5,
          },
          colors: [
            "#109640", // 00 General Staff
            "#b61217", // 01 1-7 HQ
            "#b61217", // 02 Alpha 1-7
            "#b61217", // 03 Bravo 1-7
            "#b61217", // 04 Charlie 1-7
            "#b61217", // 05 Delta 1-7
            "#2a487c", // 06 2-7 HQ
            "#2a487c", // 07 Alpha 2-7
            "#2a487c", // 08 Bravo 2-7
            "#2a487c", // 09 Charlie 2-7
            "#2a487c", // 10 Echo 2-7
            "#5bcefa", // 11 3-7 HQ
            "#5bcefa", // 12 Alpha 3-7
            "#5bcefa", // 13 Bravo 3-7
            "#5bcefa", // 14 Charlie 3-7
            "#ebc729", // 15 R&DC HQ
            "#e68c08", // 16 Alpha ACD
            "#e68c08", // 17 Bravo ACD
            "#e68c08", // 18 Charlie ACD
            "#e68c08", // 19 Delta ACD
            "#e68c08", // 20 Echo ACD
            "#7b3fa0", // 21 SP Command
            "#7b3fa0", // 22 Alpha SP
            "#7b3fa0", // 23 Bravo SP
            "#7b3fa0", // 24 Charlie SP
            "#7b3fa0", // 25 Delta SP
          ],
          plotOptions: {
            pie: {
              donut: {
                size: "85%",
                background: "transparent",
                labels: {
                  fontFamily: "Segoe UI",
                  show: true,
                  name: {
                    fontFamily: "Segoe UI",
                  },
                  value: {
                    fontFamily: "Segoe UI",
                    fontWeight: "bold",
                    color: "#a1a1a1",
                  },
                  total: {
                    color: "#f1f1f1",
                    show: true,
                    showAlways: false,
                    label: "Total Active Duty",
                    fontFamily: "Segoe UI",
                    fontWeight: "bold",
                  },
                },
              },
            },
          },
        },
        series: piechartData,
      };
    }
  }

  render() {
    return (
      <div className="donut">
        <Chart
          options={this.state.options}
          series={this.state.series}
          type="donut"
          width="65%"
        />
      </div>
    );
  }
}

export default Statistics;
