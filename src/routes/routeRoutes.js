const express = require("express");
const mongoose = require("mongoose");
const { route } = require("./vehicleRoutes");
const moment = require("moment");

const Route = mongoose.model("Route");
const RouteDetail = mongoose.model("RouteDetail");
const RouteSchedule = mongoose.model("RouteSchedule");
const RouteDeparture = mongoose.model("RouteDeparture");
const Vehicle = mongoose.model("Vehicle");
const Location = mongoose.model("Location");
const Agent = mongoose.model("Agent");
const Booking = mongoose.model("Booking");
const ManagementAdmin = mongoose.model("ManagementAdmin");
const Const = mongoose.model("Const");
const AgentDetail = mongoose.model("AgentDetail");

const router = express.Router();

router.get("/route/query", async (req, res) => {
  const payload = req.query;
  const date = new Date(payload.departureDate.substring(0, 10) + " 00:00");
  date.setDate(date.getDate() + 1);
  console.log(date.toISOString());
});

var groupBy = function (xs, key) {
  return xs.reduce(function (rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
};

var groupNext = function (routeDetails) {
  let groups = [];
  for (let i = 0; i < routeDetails.length; i++) {
    let group = [];
    let j = 0;
    for (j = i; j < routeDetails.length; j++) {
      if (routeDetails[j].routeId == routeDetails[i].routeId) {
        group.push(routeDetails[j]);
      } else {
        i = j - 1;
        break;
      }
    }

    groups.push(group);
    if (j == routeDetails.length) {
      break;
    }
  }

  return groups;
};

var byOrder = (a, b) => {
  if (a.orderRouteToStation > b.orderRouteToStation) return 1;
  if (a.orderRouteToStation < b.orderRouteToStation) return -1;
  return 0;
};

let getAgentForAdmin = async (adminId) => {
  let adminMmgs = await ManagementAdmin.find();
  let agentList = await Agent.find();
  let agents = adminMmgs.filter(
    (e) => e.admin.toString() == adminId && e.agent !== null
  );
  if (agents.length == 0) {
    agents = agentList;
    agents = agents.map((e) => e._id.toString());
  } else {
    agents = agents.filter((e) => e.agent).map((e) => e.agent.toString());
  }

  return [...new Set(agents)];
};

let setDepartureComplete = async (allRouteDetails, allbookings) => {
  let departures = await RouteDeparture.find().populate("route");
  //let allRouteDetails = await RouteDetail.find().populate("station");
  //let allbookings = Booking.find({r})
  var statusRouteComplete = await Const.findOne({
    type: "trang_thai_hanh_trinh",
    value: "da_di",
  });
  var statusBookingComplete = await Const.findOne({
    type: "trang_thai_dat_cho",
    value: "da_di",
  });

  for (let departure of departures) {
    if (departure.status.toString() != statusRouteComplete._id.toString()) {
      let date = departure.departureDate.getDate(),
        month = departure.departureDate.getMonth() + 1,
        year = departure.departureDate.getFullYear();

      let startTime = departure.route.startTime.split(":");

      let routeDetails = allRouteDetails.filter(
        (e) => e.route.toString() == departure.route._id.toString()
      );
      let timeLength = 0;
      for (let item of routeDetails) {
        timeLength += item.timeArrivingToStation;
      }

      let departureTime = moment(
        `${year}-${month}-${date} 00:00:00`,
        "YYYY-MM-DD HH:mm:ss"
      )
        .add(parseInt(startTime[0]), "hours")
        .add(parseInt(startTime[1]), "minutes")
        .add(timeLength, "hours");

      let today = new Date();
      let dateToday = today.getDate(),
        monthToday = today.getMonth() + 1,
        yearToday = today.getFullYear();

      let todayMoment = moment(
        `${yearToday}-${monthToday}-${dateToday} 00:00:00`,
        "YYYY-MM-DD HH:mm:ss"
      );

      if (todayMoment.isAfter(departureTime)) {
        departure.status = statusRouteComplete;
        await departure.save();

        let bookings = allbookings.filter(
          (e) => e.routeDeparture.toString() == departure._id.toString()
        );
        for (let booking of bookings) {
          booking.status = statusBookingComplete;
          booking.reviewed = false;
          await booking.save();
        }
      }
    }
  }
};

let setBookingTimeout = async (allbookings) => {
  let statusSeatBooking = await Const.findOne({
    type: "trang_thai_ghe",
    value: "giu_cho",
  });
  // let statusBookingRemove = await Const.findOne({
  //   type: "trang_thai_dat_cho",
  //   value: "da_huy",
  // });
  for (let booking of allbookings) {
    if (booking.seatStatus.toString() == statusSeatBooking._id.toString()) {
      let date = booking.bookingExpiredTime.getDate(),
        month = booking.bookingExpiredTime.getMonth() + 1,
        year = booking.bookingExpiredTime.getFullYear(),
        hours = booking.bookingExpiredTime.getHours(),
        minutes = booking.bookingExpiredTime.getMinutes();
      let bookingExpiredTime = moment(
        `${year}-${month}-${date} ${hours}:${minutes}:00`,
        "YYYY-MM-DD HH:mm:ss"
      );

      let today = new Date();
      let dateToday = today.getDate(),
        monthToday = today.getMonth() + 1,
        yearToday = today.getFullYear(),
        hoursToday = booking.bookingExpiredTime.getHours(),
        minutesToday = booking.bookingExpiredTime.getMinutes();

      let todayMoment = moment(
        `${yearToday}-${monthToday}-${dateToday} ${hoursToday}:${minutesToday}:00`,
        "YYYY-MM-DD HH:mm:ss"
      );
      if (todayMoment.isAfter(bookingExpiredTime)) {
        await Booking.findByIdAndDelete(mongoose.Types.ObjectId(booking._id));
      }
    }
  }
};

router.get("/route-by-agent/:admin_id", async (req, res) => {
  const routes = await Route.find()
    .populate("startLocation")
    .populate("endLocation")
    .populate("startProvince")
    .populate("endProvince")
    .populate("status")
    .populate({
      path: "vehicle",
      model: "Vehicle",
      populate: {
        path: "startLocation endLocation startProvince endProvince agent type",
      },
    });

  let agentForAdminIds = await getAgentForAdmin(req.params.admin_id);

  let results = [];
  for (let route of routes) {
    if (agentForAdminIds.some((e) => e == route.vehicle.agent._id.toString())) {
      results.push(route);
    }
  }
  res.status(200).send(results);
});

router.get("/find-routes", async (req, resp) => {
  const params = req.query;
  // console.log(params);
  const routeData = {
    startLocation: params.departureLocation,
    endLocation: params.arriveLocation,
    departureDate: params.departureDate,
  };

  let dataFinal = [];
  let allRoute = await Route.find();
  let allRouteDetails = await RouteDetail.find().populate("station");
  let allAgents = await Agent.find().populate({
    path: "reviews coupons",
    populate: {
      path: "user",
      model: "User",
    },
  });
  let allAgentDetails = await AgentDetail.find().populate("location");
  let departures = await RouteDeparture.find();
  let allBookings = await Booking.find();
  let allLocations = await Location.find();
  let allConst = await Const.find();
  let allSchedules = await RouteSchedule.find();

  var seatStatusUnavailable = await Const.findOne({
    type: "trang_thai_ghe",
    value: "da_dat",
  });
  var seatStatusPlaceholder = await Const.findOne({
    type: "trang_thai_ghe",
    value: "giu_cho",
  });
  var statusBookingRemove = await Const.findOne({
    type: "trang_thai_dat_cho",
    value: "da_huy",
  });

  // chạy tự động set chuyến đã đi
  setDepartureComplete(allRouteDetails, allBookings);
  // set booking hết hạn
  setBookingTimeout(allBookings);

  // try{
  let routeDetailByStartLocs = allRouteDetails.filter(
    (e) =>
      e.station.stationStop == routeData.startLocation ||
      e.station.province == routeData.startLocation
  );
  let routes = routeDetailByStartLocs.map((e) => e.route);
  let routeDetails = routes.flatMap((e) =>
    allRouteDetails.filter((i) => i.route.toString() == e.toString())
  );
  let routeDetailByEndLocs = routeDetails.filter(
    (e) =>
      e.station.stationStop == routeData.endLocation ||
      e.station.province == routeData.endLocation
  );
  if (routeDetailByEndLocs.length == 0) {
    let condition = (e) =>
      e.station.stationStop == routeData.startLocation ||
      e.station.province == routeData.startLocation ||
      e.station.stationStop == routeData.endLocation ||
      e.station.province == routeData.endLocation;

    let stationByRouteDetails = allRouteDetails.filter(condition);

    let routes = stationByRouteDetails.map((e) => e.route);
    stationByRouteDetails = routes.flatMap((e) =>
      allRouteDetails.filter((i) => i.route.toString() == e.toString())
    );

    let flatStations = [];
    for (let stationDetail of stationByRouteDetails) {
      if (
        flatStations.some(
          (e) =>
            e.station.stationStop.toString() ==
            stationDetail.station.stationStop.toString()
        )
      ) {
        continue;
      }

      flatStations.push(stationDetail);
    }

    let groupRoutes = groupBy(stationByRouteDetails, "route");
    let findIndexOfStation = (routeDetail) => {
      return flatStations.findIndex(
        (e) =>
          e.station.stationStop.toString() ==
          routeDetail.station.stationStop.toString()
      );
    };

    let startIndex = flatStations.findIndex(
      (e) =>
        e.station.stationStop.toString() == routeData.startLocation ||
        e.station.province.toString() == routeData.startLocation
    );
    let endIndex = flatStations.findIndex(
      (e) =>
        e.station.stationStop.toString() == routeData.endLocation ||
        e.station.province.toString() == routeData.endLocation
    );

    let graphStations = new Array(flatStations.length);
    for (let i = 0; i < graphStations.length; i++) {
      graphStations[i] = new Array(flatStations.length).fill({
        isAdjacent: false,
        subRoutes: null,
        byRoutes: null,
      });
    }

    for (prop in groupRoutes) {
      let routeStations = groupRoutes[prop];
      for (let i = 0; i < routeStations.length - 1; i++) {
        let x = findIndexOfStation(routeStations[i]);
        for (let j = i + 1; j < routeStations.length; j++) {
          let y = findIndexOfStation(routeStations[j]);
          if (graphStations[x][y].isAdjacent) {
            graphStations[x][y].subRoutes.push(routeStations.slice(i, j));
            graphStations[x][y].byRoutes.push(prop);
          } else {
            if (startIndex > endIndex && x > y) {
              graphStations[x][y] = {
                isAdjacent: true,
                subRoutes: routeStations.slice(i, j),
                byRoutes: [prop],
              };
            } else if (startIndex < endIndex && x < y) {
              graphStations[x][y] = {
                isAdjacent: true,
                subRoutes: routeStations.slice(i, j),
                byRoutes: [prop],
              };
            }
          }
        }
      }
    }

    let findRoutes = (u, d, visited, paths, pathIndex) => {
      visited[u] = true;
      paths[pathIndex] = u;
      pathIndex++;

      if (u == d) {
        let subRouteDetailPaths = paths.slice(0, pathIndex);
        foundRoutes.push(subRouteDetailPaths);
      } else {
        for (let i = 0; i < flatStations.length; i++) {
          if (graphStations[u][i].isAdjacent && !visited[i]) {
            findRoutes(i, d, visited, paths, pathIndex);
          }
        }
      }

      pathIndex--;
      visited[u] = false;
    };

    let visited = new Array(flatStations.length).fill(false);
    let paths = new Array(flatStations.length).fill(0);
    let pathIndex = 0;

    let foundRoutes = [];
    findRoutes(startIndex, endIndex, visited, paths, pathIndex);

    //let avg = Math.ceil(foundRoutes.map(e => e.length).reduce((a, b) => a + b, 0) / foundRoutes.length / 2)
    let min = Math.min(...foundRoutes.map(({ length }) => length));
    foundRoutes = foundRoutes.filter((e) => e.length == min);

    let allDetailRoutes = [];
    for (let foundRoute of foundRoutes) {
      let labels = [];
      for (let i = 0; i < foundRoute.length - 1; i++) {
        labels.push({
          x: foundRoute[i],
          y: foundRoute[i + 1],
          data: graphStations[foundRoute[i]][foundRoute[i + 1]].byRoutes,
        });
      }

      let dataLabels = labels.map((e) => e.data);
      let flatLabels = [];
      for (let i = 0; i < dataLabels.length; i++) {
        for (let j = 0; j < dataLabels[i].length; j++) {
          flatLabels.push(`${i}-${dataLabels[i][j]}`);
        }
      }

      if (flatLabels.length == 2) {
        let route1 = graphStations[foundRoute[0]][foundRoute[1]].subRoutes;
        let route2 = graphStations[foundRoute[1]][foundRoute[2]].subRoutes;

        allDetailRoutes.push([
          {
            routeId: flatLabels[0].split("-")[1],
            stationStopId: route1[0].station.stationStop.toString(),
          },
          {
            routeId: flatLabels[0].split("-")[1],
            stationStopId: route1[1].station.stationStop.toString(),
          },
          {
            routeId: flatLabels[1].split("-")[1],
            stationStopId: route2[0].station.stationStop.toString(),
          },
        ]);
      } else {
        let n = labels.flatMap((e) => e.data).length;
        let subGraph = new Array(n);
        for (let i = 0; i < n; i++) {
          subGraph[i] = new Array(n).fill({
            isAdjacent: false,
            from: null,
            to: null,
          });
        }

        for (let i = 0; i < n; i++) {
          let currentLabel = flatLabels[i];
          let groupNumber = parseInt(currentLabel.split("-")[0]);
          let nextGroupNumber = groupNumber + 1;
          for (let j = 0; j < n; j++) {
            if (flatLabels[j].startsWith(nextGroupNumber + "-")) {
              subGraph[i][j] = {
                isAdjacent: true,
                from: flatLabels[i],
                to: flatLabels[j],
              };
            }
          }
        }

        let findSubRoutes = (u, d, visited, paths, pathIndex) => {
          visited[u] = true;
          paths[pathIndex] = u;
          pathIndex++;

          if (u == d) {
            currentSubRoutes.push(paths.slice(0, pathIndex));
          } else {
            for (let i = 0; i < flatLabels.length; i++) {
              if (subGraph[u][i].isAdjacent && !visited[i]) {
                findSubRoutes(i, d, visited, paths, pathIndex);
              }
            }
          }

          pathIndex--;
          visited[u] = false;
        };

        let foundSubRoutes = [];
        let currentSubRoutes = [];
        for (let i = 0; i < flatLabels.length; i++) {
          if (flatLabels[i].startsWith("0-")) {
            for (let j = flatLabels.length - 1; j >= 0; j--) {
              if (flatLabels[j].startsWith(`${dataLabels.length - 1}-`)) {
                visited = new Array(flatLabels.length).fill(false);
                paths = new Array(flatLabels.length).fill(0);
                currentSubRoutes = [];
                findSubRoutes(i, j, visited, paths, 0);
                currentSubRoutes.forEach((e) => foundSubRoutes.push(e));
              }
            }
          }
        }

        let mapRoutes = foundSubRoutes.map((e) =>
          e.map((i) => flatLabels[i].split("-")[1])
        );
        let detailRoutes = [];
        for (let i = 0; i < mapRoutes.length; i++) {
          let temp = [];
          for (let j = 0; j < mapRoutes[i].length; j++) {
            temp.push({
              routeId: mapRoutes[i][j],
              stationStopId: flatStations[
                foundRoute[j]
              ].station.stationStop.toString(),
            });
          }

          detailRoutes.push(temp);
        }

        detailRoutes.forEach((e) => {
          allDetailRoutes.push(e);
        });
      }
    }

    let initTimeOfRoute = (startTime, routeId) => {
      let route = allRoute.find((e) => e._id.toString() == routeId);
      let time = route.startTime.split(":");

      let temp = moment(
        startTime.format("YYYY-MM-DD HH:mm:ss"),
        "YYYY-MM-DD HH:mm:ss"
      );

      temp.add(parseInt(time[0]), "hours").add(parseInt(time[1]), "minutes");
      return temp;
    };

    let getRouteDetail = (routeData) => {
      return allRouteDetails.find(
        (e) =>
          e.station.stationStop == routeData.stationStopId.toString() &&
          e.route == routeData.routeId
      );
    };

    let findTimeToStation = (time, stationRouteDetail) => {
      let routeDetails = allRouteDetails.filter(
        (e) =>
          e.route.toString() == stationRouteDetail.route.toString() &&
          e.orderRouteToStation <= stationRouteDetail.orderRouteToStation
      );
      routeDetails.sort(byOrder);

      let temp = moment(
        time.format("YYYY-MM-DD HH:mm:ss"),
        "YYYY-MM-DD HH:mm:ss"
      );

      for (let detail of routeDetails) {
        temp.add(detail.timeArrivingToStation, "hours");
      }

      return temp;
    };

    let findTimeToNextRouteDetail = (initTime, routeData) => {
      let currentRouteDetail = getRouteDetail(routeData);
      // let nextRouteDetail = allRouteDetails.find(
      //   (e) =>
      //     e.route.toString() == routeData.routeId &&
      //     e.orderRouteToStation == currentRouteDetail.orderRouteToStation + 1
      // );
      //initTime.add(nextRouteDetail.timeArrivingToStation, "hours");
      let nextRouteDetail = allRouteDetails.filter(
        (e) =>
          e.route.toString() == routeData.routeId &&
          e.orderRouteToStation > currentRouteDetail.orderRouteToStation
      );

      for (let item of nextRouteDetail) {
        initTime.add(item.timeArrivingToStation, "hours");
      }
      return initTime;
    };

    let findTimeToNextStation = (startTime, routeData) => {
      let routeDetail = getRouteDetail(routeData);
      startTime.add(routeDetail.timeArrivingToStation, "hours");

      return startTime;
    };

    let findTimeToCurrentStation = (initTime, routeData) => {
      let dayOfTime = moment(
        `${initTime.format("YYYY-MM-DD")} 00:00:00`,
        "YYYY-MM-DD HH:mm:ss"
      );
      let time = initTimeOfRoute(dayOfTime, routeData.routeId);
      let routeDetail = getRouteDetail(routeData);
      time = findTimeToStation(time, routeDetail);

      return time;
    };

    let findTimeBySchedule = (initTime, routeData) => {
      let dow = initTime.day();
      let routeSchedules = allSchedules
        .filter((e) => e.route.toString() == routeData.routeId)
        .map((e) => e.dayOfWeek);
      let idx = routeSchedules.indexOf(dow);
      if (idx == -1) {
        routeSchedules.push(dow);
      }

      routeSchedules.sort((a, b) => a - b);
      idx = routeSchedules.indexOf(dow);

      let foundDay;
      if (idx == routeSchedules.length - 1) {
        foundDay = routeSchedules[0];
      } else {
        foundDay = routeSchedules[idx + 1];
      }

      let dayOfWeeks = [0, 1, 2, 3, 4, 5, 6];
      let countDay;
      if (foundDay > dow) {
        countDay = foundDay - dow;
      } else {
        countDay = dayOfWeeks.length - (dow - foundDay);
      }

      let startTime = moment(
        `${initTime.format("YYYY-MM-DD")} 00:00:00`,
        "YYYY-MM-DD HH:mm:ss"
      );
      startTime.add(countDay, "days");

      startTime = initTimeOfRoute(startTime, routeData.routeId);
      let routeDetail = getRouteDetail(routeData);
      startTime = findTimeToStation(startTime, routeDetail);

      return startTime;
    };

    let CheckSameDay = (time) => {
      let timetoStartTime = new Date(time.format("MM/DD/YYYY"));
      let startTimeDate = timetoStartTime.getDate();
      let startTimeMonth = timetoStartTime.getMonth() + 1;
      let startTimeYear = timetoStartTime.getFullYear();

      //test
      let timeToday = new Date();
      let timeDateToday = timeToday.getDate();
      let timeMonthToday = timeToday.getMonth() + 1;
      let timeYearToday = timeToday.getFullYear();
      let timeTodayMoment = moment(
        `${timeToday.getFullYear()}-${
          timeToday.getMonth() + 1
        }-${timeToday.getDate()} ${timeToday.getHours()}:${timeToday.getMinutes()}:00`,
        "YYYY-MM-DD HH:mm:ss"
      ).add(2, "hours");

      if (
        timeDateToday == startTimeDate &&
        timeMonthToday == startTimeMonth &&
        timeYearToday == startTimeYear
      ) {
        if (timeTodayMoment.isAfter(time)) {
          return true;
        }
      }
      return false;
    };

    let findTimeToSchedule = (routeId, initTime, timeToRoute) => {
      let gettimeIniteTime = moment(
        initTime.format("YYYY-MM-DD 00:00:00"),
        "YYYY-MM-DD HH:mm:ss"
      );
      let gettimeToRoute = moment(
        timeToRoute.format("YYYY-MM-DD 00:00:00"),
        "YYYY-MM-DD HH:mm:ss"
      );
      let subDay = moment
        .duration(
          gettimeToRoute.valueOf() - gettimeIniteTime.valueOf(),
          "milliseconds"
        )
        .asDays();

      let time = initTime.subtract(subDay, "days");
      let dateSelect = new Date(time.format("MM/DD/YYYY"));
      let scheduleRoute = allSchedules.find(
        (e) =>
          e.route == routeId.toString() && e.dayOfWeek == dateSelect.getDay()
      );

      if (scheduleRoute) {
        return timeToRoute.subtract(subDay, "days");
      }
      return null;
    };

    // let checkRouteValid = (routes) => {
    //   let routeIds = routes.map(e => e[0].routeId);
    //   let runOrders = allRoute.filter(e => routeIds.some(i => i == e._id.toString())).map(e => e.isCorrectRoute);

    //   return runOrders.every(e => e) || runOrders.every(e => !e);
    // }

    //allDetailRoutes = allDetailRoutes.slice(0, 20);
    let routeIds = [
      ...new Set(allDetailRoutes.flatMap((e) => e.map((i) => i.routeId))),
    ];
    allRouteDetails = allRouteDetails.filter((e) =>
      routeIds.some((i) => i == e.route.toString())
    );

    let validRoute = [];
    for (let routeItem of allDetailRoutes) {
      let validCheck = true;
      let temp = groupNext(routeItem);
      // check số chuyến không được lớn hơn 3
      if (temp.length > 3) {
        continue;
      }
      let startTime = new Date(routeData.departureDate);
      startTime = moment(
        `${startTime.getFullYear()}-${
          startTime.getMonth() + 1
        }-${startTime.getDate()} 00:00:00`,
        "YYYY-MM-DD HH:mm:ss"
      );

      let startTimes = [];
      for (let i = 0; i < temp.length; i++) {
        if (!validCheck) {
          break;
        }
        for (let j = 0; j < temp[i].length; j++) {
          if (j == 0) {
            if (i == 0) {
              startTime = initTimeOfRoute(startTime, temp[0][0].routeId);
              let timeToStartRoute = startTime;
              let routeDetail = getRouteDetail(temp[0][0]);
              startTime = findTimeToStation(startTime, routeDetail);
              let timeSchedule = findTimeToSchedule(
                temp[0][0].routeId,
                timeToStartRoute,
                startTime
              );
              if (timeSchedule) {
                if (!CheckSameDay(timeSchedule)) {
                  startTime = timeSchedule;
                } else {
                  validCheck = false;
                  break;
                }
              } else {
                validCheck = false;
                break;
              }
            } else {
              if (temp[i - 1].length == 1) {
                startTime = findTimeToNextRouteDetail(
                  startTime,
                  temp[i - 1][0]
                );
              }

              let timeToRoute = findTimeToCurrentStation(startTime, temp[i][0]);
              if (timeToRoute.isAfter(startTime)) {
                // Cùng ngày, giờ hợp lệ
                startTime = timeToRoute;
              } else {
                startTime = findTimeBySchedule(startTime, temp[i][j]);
              }
            }

            startTimes.push(
              moment(
                `${startTime.format("YYYY-MM-DD HH:mm:ss")}`,
                "YYYY-MM-DD HH:mm:ss"
              )
            );
          } else {
            startTime = findTimeToNextStation(startTime, temp[i][j]);
            if (j == temp[i].length - 1) {
              startTime = findTimeToNextRouteDetail(startTime, temp[i][j]);
            }
          }
        }
      }

      if (validCheck) {
        validRoute.push({
          routeItem: routeItem,
          startTimes: startTimes,
        });
      }
    }

    let sendDateFinalRoute = (routeItem, startTimes) => {
      let groupRouteValid = groupNext(routeItem);
      let temp = [];
      let routeDetailByEnd = allRouteDetails.find(
        (e) =>
          e.station.stationStop.toString() == routeData.endLocation ||
          e.station.province == routeData.endLocation
      );
      let endDetail = {
        routeId: routeDetailByEnd.route.toString(),
        stationStopId: routeDetailByEnd.station.stationStop.toString(),
      };
      for (let i = 0; i < groupRouteValid.length; i++) {
        let start = groupRouteValid[i][0];
        let end;
        if (i == groupRouteValid.length - 1) {
          end = endDetail;
        } else {
          end = groupRouteValid[i + 1][0];
        }
        temp.push({
          routeId: start.routeId,
          startStation: start,
          endStation: end,
          startTime: startTimes[i],
        });
      }
      return temp;
    };

    let isSameRoute = (routes1, routes2) => {
      if (routes1.length != routes2.length) {
        return false;
      }

      for (let i = 0; i < routes1.length; i++) {
        if (
          routes1[i].routeId != routes2[i].routeId ||
          routes1[i].startStation.stationStopId !=
            routes2[i].startStation.stationStopId
        ) {
          return false;
        }
      }

      return true;
    };

    let isExistedRoute = (routes, listRoutes) => {
      let sameLengthRoutes = listRoutes.filter(
        (e) => e.length == routes.length
      );
      if (sameLengthRoutes.length > 0) {
        return sameLengthRoutes.some((e) => isSameRoute(e, routes));
      }

      return false;
    };

    let dataValidRoute = [];
    for (let routeValidItem of validRoute) {
      let datavalid = sendDateFinalRoute(
        routeValidItem.routeItem,
        routeValidItem.startTimes
      );
      if (!isExistedRoute(datavalid, dataValidRoute)) {
        dataValidRoute.push(datavalid);
      }
    }

    let findTimeAndPrice = (details, route, startStationId, endStationId) => {
      let start = details.find(
        (e) => e.station.stationStop.toString() == startStationId
      );
      let end = details.find(
        (e) => e.station.stationStop.toString() == endStationId
      );

      let ranges = details.filter(
        (e) => e.orderRouteToStation <= end.orderRouteToStation
      );
      ranges.sort(byOrder);

      let startTimeLength = 0,
        endTimeLength = 0;
      let disStartLength = 0,
        disEndLength = 0;
      for (let item of ranges) {
        if (item.orderRouteToStation <= start.orderRouteToStation) {
          startTimeLength += item.timeArrivingToStation;
          disStartLength += item.distanceToStation;
        }

        if (item.orderRouteToStation <= end.orderRouteToStation) {
          endTimeLength += item.timeArrivingToStation;
          disEndLength += item.distanceToStation;
        }
      }

      let startTime = route.startTime.split(":");
      let today = new Date();
      let dateToday = today.getDate(),
        monthToday = today.getMonth() + 1,
        yearToday = today.getFullYear();

      let startHour = moment(
        `${yearToday}-${monthToday}-${dateToday} 00:00:00`,
        "YYYY-MM-DD HH:mm:ss"
      )
        .add(parseInt(startTime[0]), "hours")
        .add(parseInt(startTime[1]), "minutes")
        .add(startTimeLength, "hours");
      let endHour = moment(
        `${yearToday}-${monthToday}-${dateToday} 00:00:00`,
        "YYYY-MM-DD HH:mm:ss"
      )
        .add(parseInt(startTime[0]), "hours")
        .add(parseInt(startTime[1]), "minutes")
        .add(endTimeLength, "hours");

      let vehicle = route.vehicle;

      let agent = allAgents.find(
        (e) => e._id.toString() == vehicle.agent.toString()
      );
      let pricePerKm = agent.priceToDistance;

      let agentDetails = allAgentDetails.filter(
        (e) => e.agent.toString() == vehicle.agent.toString()
      );

      return {
        startHour: startHour,
        endHour: endHour,
        price: (disEndLength - disStartLength) * pricePerKm,
        agent: agent,
        agentDetails: agentDetails,
      };
    };

    let getLocation = (locationId) => {
      let location = allLocations.find((e) => e._id.toString() == locationId);
      return location.address;
    };

    let getDeptAndEmptySeats = (routeId, vehicle, dayStart) => {
      let selectedDate = new Date(dayStart);
      let date = selectedDate.getDate();
      let month = selectedDate.getMonth();
      let year = selectedDate.getFullYear();

      let departure = departures.find(
        (e) =>
          e.route.toString() == routeId &&
          date == e.departureDate.getDate() &&
          month == e.departureDate.getMonth() &&
          year == e.departureDate.getFullYear()
      );
      let totalSeats = vehicle.totalSeats;
      let depId = null,
        emptySeats = totalSeats;
      if (departure) {
        depId = departure._id.toString();
        let bookedSeats = allBookings.filter(
          (e) =>
            e.routeDeparture.toString() == departure._id.toString() &&
            e.status.toString() != statusBookingRemove._id.toString() &&
            (e.seatStatus.toString() == seatStatusUnavailable._id.toString() ||
              e.seatStatus.toString() == seatStatusPlaceholder._id.toString())
        ).length;
        emptySeats = totalSeats - bookedSeats;
      }

      return {
        depId: depId,
        emptySeats: emptySeats,
      };
    };

    let findTimeToEndStation = (
      routeId,
      startStationId,
      endStationId,
      initTime
    ) => {
      let routeDetails = allRouteDetails.filter(
        (e) => e.route.toString() == routeId
      );
      let startStation = routeDetails.find(
        (e) => e.station.stationStop.toString() == startStationId
      );
      let endStation = routeDetails.find(
        (e) => e.station.stationStop.toString() == endStationId
      );

      routeDetails = routeDetails.filter(
        (e) =>
          e.orderRouteToStation > startStation.orderRouteToStation &&
          e.orderRouteToStation <= endStation.orderRouteToStation
      );
      let temp = moment(
        initTime.format("YYYY-MM-DD HH:mm:ss"),
        "YYYY-MM-DD HH:mm:ss"
      );
      for (let routeDetail of routeDetails) {
        temp.add(routeDetail.timeArrivingToStation, "hours");
      }

      return temp;
    };

    let mapRouteToDataFinal = async (routeDetail, isFirstRoute = false) => {
      // Get route with vehicle
      let route = await Route.findById(routeDetail.routeId).populate("vehicle");

      // Get route details
      let routeDetails = allRouteDetails.filter(
        (e) => e.route.toString() == route._id.toString()
      );

      let startAddress = getLocation(routeDetail.startStation.stationStopId);
      let endAddress = getLocation(routeDetail.endStation.stationStopId);

      let timeAndPrice = findTimeAndPrice(
        routeDetails,
        route,
        routeDetail.startStation.stationStopId,
        routeDetail.endStation.stationStopId
      );
      let deptAndSeats = getDeptAndEmptySeats(
        route._id.toString(),
        route.vehicle,
        routeDetail.startTime.format("MM/DD/YYYY")
      );

      let typeVehicle = allConst.find(
        (e) => e._id.toString() == route.vehicle.type.toString()
      );

      // Find time to end station
      let endTime = findTimeToEndStation(
        routeDetail.routeId,
        routeDetail.startStation.stationStopId,
        routeDetail.endStation.stationStopId,
        routeDetail.startTime
      );

      return {
        _id: route._id.toString(),
        vehicle: route.vehicle,
        typeVehicle: typeVehicle,
        agent: timeAndPrice.agent,
        agentDetails: timeAndPrice.agentDetails,
        startLocation: startAddress,
        endLocation: endAddress,
        startDate: routeDetail.startTime.format("MM/DD/YYYY HH:mm"),
        endDate: endTime.format("MM/DD/YYYY HH:mm"),
        startTime: timeAndPrice.startHour.format("HH:mm"),
        endTime: timeAndPrice.endHour.format("HH:mm"),
        price: timeAndPrice.price,
        departureId: deptAndSeats.depId,
        emptySeats: deptAndSeats.emptySeats,
        reviewRate : timeAndPrice.agent.reviewRate == null ? 3 : timeAndPrice.agent.reviewRate
      };
    };

    for (let validRoute of dataValidRoute) {
      let mapRoutes = [];
      let firstRoute = await mapRouteToDataFinal(validRoute[0], true);
      if (firstRoute) {
        mapRoutes.push(firstRoute);
        for (let i = 1; i < validRoute.length; i++) {
          mapRoutes.push(await mapRouteToDataFinal(validRoute[i]));
        }

        let endTime = moment(
          mapRoutes[mapRoutes.length - 1].endDate,
          "MM-DD-YYYY HH:mm"
        );
        let startTime = moment(mapRoutes[0].startDate, "MM-DD-YYYY HH:mm");

        let diffTime = endTime.valueOf() - startTime.valueOf();
        diffTime = moment.duration(diffTime, "milliseconds").asDays();

        let totalPrice = mapRoutes.reduce((a, b) => a + b["price"], 0);

        let totalRate = mapRoutes.reduce((a, b) => a + b["reviewRate"], 0);

        if (diffTime <= 3) {
          dataFinal.push({
            totalTime: diffTime,
            totalPrice: totalPrice,
            reviewRate : totalRate / mapRoutes.length,
            routes: mapRoutes,
          });
        }
      }
    }

    return resp.send(dataFinal);
  }

  routes = routeDetailByEndLocs.map((e) => e.route);
  routeDetails = routes.flatMap((e) =>
    allRouteDetails.filter((i) => i.route.toString() == e.toString())
  );
  let routeDetailGroups = groupBy(routeDetails, "route");

  //tesst
  let initTimeOfRoute = (routeId, time) => {
    let route = allRoute.find((e) => e._id.toString() == routeId);
    let routetime = route.startTime.split(":");

    let temp = moment(
      time.format("YYYY-MM-DD HH:mm:ss"),
      "YYYY-MM-DD HH:mm:ss"
    );

    temp
      .add(parseInt(routetime[0]), "hours")
      .add(parseInt(routetime[1]), "minutes");

    return temp;
  };

  let findTimeToStation = (time, stationRouteDetail) => {
    let routeDetails = allRouteDetails.filter(
      (e) =>
        e.route.toString() == stationRouteDetail.route.toString() &&
        e.orderRouteToStation <= stationRouteDetail.orderRouteToStation
    );
    routeDetails.sort(byOrder);

    let temp = moment(
      time.format("YYYY-MM-DD HH:mm:ss"),
      "YYYY-MM-DD HH:mm:ss"
    );

    for (let detail of routeDetails) {
      temp.add(detail.timeArrivingToStation, "hours");
    }

    return temp;
  };
  //end test

  let schedules = [];
  let startTimeToRoute = [];
  for (prop in routeDetailGroups) {
    let start = routeDetailGroups[prop].find(
      (e) =>
        e.station.stationStop == routeData.startLocation ||
        e.station.province == routeData.startLocation
    );
    let end = routeDetailGroups[prop].find(
      (e) =>
        e.station.stationStop == routeData.endLocation ||
        e.station.province == routeData.endLocation
    );

    if (start.orderRouteToStation < end.orderRouteToStation) {
      let selectedDate = new Date(routeData.departureDate);
      let date = selectedDate.getDate();
      let month = selectedDate.getMonth() + 1;
      let year = selectedDate.getFullYear();

      //get start Date
      let startTime = moment(
        `${year}-${month}-${date} 00:00:00`,
        "YYYY-MM-DD HH:mm:ss"
      );

      let inittime = initTimeOfRoute(prop, startTime);
      let time = findTimeToStation(inittime, start);

      let gettimeIniteTime = moment(
        inittime.format("YYYY-MM-DD 00:00:00"),
        "YYYY-MM-DD HH:mm:ss"
      );
      let gettimeToTime = moment(
        time.format("YYYY-MM-DD 00:00:00"),
        "YYYY-MM-DD HH:mm:ss"
      );
      let subDay = moment
        .duration(
          gettimeToTime.valueOf() - gettimeIniteTime.valueOf(),
          "milliseconds"
        )
        .asDays();

      startTime = startTime.subtract(subDay, "days");

      let dateSelect = new Date(startTime.format("MM/DD/YYYY"));
      let scheduleRoute = await RouteSchedule.findOne({
        $and: [{ route: prop.toString() }, { dayOfWeek: dateSelect.getDay() }],
      });
      if (scheduleRoute) {
        startTimeToRoute.push({
          route: prop,
          date: dateSelect,
        });
        schedules.push(scheduleRoute);
      }
    }
  }

  routes = schedules.map((e) => e.route.toString());
  routes = await Route.find({ _id: { $in: routes } }).populate("vehicle");

  routeDetails = routes.flatMap((e) =>
    allRouteDetails.filter((i) => i.route.toString() == e._id.toString())
  );
  routeDetailGroups = groupBy(routeDetails, "route");

  for (prop in routeDetailGroups) {
    let details = routeDetailGroups[prop];

    let start = details.find(
      (e) =>
        e.station.stationStop == routeData.startLocation ||
        e.station.province == routeData.startLocation
    );
    let end = details.find(
      (e) =>
        e.station.stationStop == routeData.endLocation ||
        e.station.province == routeData.endLocation
    );

    let startAddress = allLocations.find(
      (e) => e._id == start.station.stationStop.toString()
    ).address;
    let endAddress = allLocations.find(
      (e) => e._id == end.station.stationStop.toString()
    ).address;

    let ranges = details.filter(
      (e) => e.orderRouteToStation <= end.orderRouteToStation
    );
    ranges.sort(byOrder);

    let startTimeLength = 0,
      endTimeLength = 0;
    let disStartLength = 0,
      disEndLength = 0;
    for (let item of ranges) {
      if (item.orderRouteToStation <= start.orderRouteToStation) {
        startTimeLength += item.timeArrivingToStation;
        disStartLength += item.distanceToStation;
      }

      if (item.orderRouteToStation <= end.orderRouteToStation) {
        endTimeLength += item.timeArrivingToStation;
        disEndLength += item.distanceToStation;
      }
    }

    let route = routes.find((e) => e._id.toString() == prop);
    let startTime = route.startTime.split(":");
    let today = new Date();
    let dateToday = today.getDate(),
      monthToday = today.getMonth() + 1,
      yearToday = today.getFullYear();

    let startHour = moment(
      `${yearToday}-${monthToday}-${dateToday} 00:00:00`,
      "YYYY-MM-DD HH:mm:ss"
    )
      .add(parseInt(startTime[0]), "hours")
      .add(parseInt(startTime[1]), "minutes")
      .add(startTimeLength, "hours");
    let endHour = moment(
      `${yearToday}-${monthToday}-${dateToday} 00:00:00`,
      "YYYY-MM-DD HH:mm:ss"
    )
      .add(parseInt(startTime[0]), "hours")
      .add(parseInt(startTime[1]), "minutes")
      .add(endTimeLength, "hours");

    let vehicle = route.vehicle;
    let typeVehicle = allConst.find(
      (e) => e._id.toString() == vehicle.type.toString()
    );
    let agent = allAgents.find(
      (e) => e._id.toString() == vehicle.agent.toString()
    );
    let pricePerKm = agent.priceToDistance;

    let agentDetails = allAgentDetails.filter(
      (e) => e.agent.toString() == vehicle.agent.toString()
    );

    // get date to Route
    let dateSelectToRoute = startTimeToRoute.find((e) => e.route == prop).date;

    let selectedDate = new Date(dateSelectToRoute);
    let date = selectedDate.getDate();
    let month = selectedDate.getMonth() + 1;
    let year = selectedDate.getFullYear();

    //get start Date
    let startDate = moment(
      `${year}-${month}-${date} 00:00:00`,
      "YYYY-MM-DD HH:mm:ss"
    )
      .add(parseInt(startTime[0]), "hours")
      .add(parseInt(startTime[1]), "minutes")
      .add(startTimeLength, "hours");

    let endDate = moment(
      `${year}-${month}-${date} 00:00:00`,
      "YYYY-MM-DD HH:mm:ss"
    )
      .add(parseInt(startTime[0]), "hours")
      .add(parseInt(startTime[1]), "minutes")
      .add(endTimeLength, "hours");

    let departure = departures.find(
      (e) =>
        e.route.toString() == prop &&
        date == e.departureDate.getDate() &&
        month == e.departureDate.getMonth() + 1 &&
        year == e.departureDate.getFullYear()
    );
    let totalSeats = vehicle.totalSeats;
    let depId = null,
      emptySeats = totalSeats;
    if (departure) {
      depId = departure._id.toString();
      let bookedSeats = allBookings.filter(
        (e) =>
          e.routeDeparture.toString() == departure._id.toString() &&
          e.status.toString() != statusBookingRemove._id.toString() &&
          (e.seatStatus.toString() == seatStatusUnavailable._id.toString() ||
            e.seatStatus.toString() == seatStatusPlaceholder._id.toString())
      ).length;
      emptySeats = totalSeats - bookedSeats;
    }

    let valid = true;
    if (dateToday == date && monthToday == month && yearToday == year) {
      let hourToday = today.getHours();
      let minuteToday = today.getMinutes();
      let temp = moment(
        `${yearToday}-${monthToday}-${dateToday} ${hourToday}:${minuteToday}:00`,
        "YYYY-MM-DD HH:mm:ss"
      ).add(2, "hours");
      if (!temp.isBefore(startHour, "hours")) {
        valid = false;
      }
    }

    if (valid) {
      dataFinal.push({
        totalTime: moment
          .duration(endHour.valueOf() - startHour.valueOf(), "milliseconds")
          .asDays(),
        totalPrice: (disEndLength - disStartLength) * pricePerKm,
        reviewRate : agent.reviewRate == null ? 3 : agent.reviewRate,
        routes: [
          {
            _id: prop,
            vehicle: vehicle,
            typeVehicle: typeVehicle,
            agent: agent,
            agentDetails: agentDetails,
            startLocation: startAddress,
            endLocation: endAddress,
            startDate: startDate.format("MM/DD/YYYY HH:mm"),
            endDate: endDate.format("MM/DD/YYYY HH:mm"),
            startTime: startHour.format("HH:mm"),
            endTime: endHour.format("HH:mm"),
            price: (disEndLength - disStartLength) * pricePerKm,
            departureId: depId,
            emptySeats: emptySeats,
          },
        ],
      });
    }
  }
  return resp.send(dataFinal);
});

router.get("/testtime", (req, resp) => {
  const format = "YYYY-MM-DD HH:mm";
  let a = moment("2020-07-08 00:00", format);
  let b = moment("2020-07-08 12:00", format);

  let c = b.valueOf() - a.valueOf();

  resp.send({
    a: a.format(format),
    b: b.format(format),
    a_mili: a.valueOf(),
    b_mili: b.valueOf(),
    c_mili: c,
    c: moment.duration(c, "milliseconds").asDays(),
  });
});

router.get("/route/:route_id", async (req, res) => {
  Route.findById(req.params.route_id)
    .populate("startLocation")
    .populate("endLocation")
    .populate({
      path: "status",
      model: "Const",
      populate: {
        path: "agent",
      },
    })
    .populate({
      path: "vehicle",
      model: "Vehicle",
      populate: {
        path: "startLocation endLocation agent type",
      },
    })
    .then((result) => {
      result = result.toJSON();
      delete result.__v;
      res.status(200).send(result);
    });

  //res.status(200).send(route);
  // Route.findById(req.params.route_id).then((result) => {
  //   result = result.toJSON();
  //   delete result.__v;
  //   res.status(200).send(result);
  // });
});

router.post("/route", async (req, res) => {
  const newRoute = req.body;
  try {
    const route = new Route({
      vehicle: newRoute.vehicle,
      startTime: newRoute.startTime,
      endTime: newRoute.endTime,
      startLocation: newRoute.startLocation,
      endLocation: newRoute.endLocation,
      status: newRoute.status,
      price: newRoute.price,
      departureDate: new Date(newRoute.departureDate),
    });
    await route.save();
    res.status(200).send({ route: route });
  } catch (err) {
    console.log(err.message);
    res.status(422).send(err.message);
  }
});

router.post("/route/addRouteDetailAndRouteSchedule", async (req, res) => {
  const data = req.body;
  const vehicle = await Vehicle.findById(data.vehicleId);
  if (!vehicle) {
    return res.status(404);
  }
  const route = new Route({
    vehicle: vehicle._id,
    startTime: data.startTime,
    endTime: data.endTime,
    startLocation: vehicle.startLocation,
    startProvince: vehicle.startProvince,
    endLocation: vehicle.endLocation,
    endProvince: vehicle.endProvince,
    price: data.price,
    isCorrectRoute: data.isCorrectRoute,
  });

  await route.save();

  let length = data.stationId.length;
  for (let i = 0; i < length; i++) {
    const routeDetail = new RouteDetail({
      route: route._id,
      station: data.stationId[i],
      timeArrivingToStation: data.stationTime[i],
      distanceToStation: data.stationDistance[i],
      orderRouteToStation: data.orderStation[i],
    });
    await routeDetail.save();
  }

  let lenghtDay = data.day.length;
  for (let i = 0; i < lenghtDay; i++) {
    const routeSchedule = new RouteSchedule({
      route: route._id,
      dayOfWeek: data.day[i],
    });
    await routeSchedule.save();
  }

  return res.status(200).json({
    message: "Data save changed successfully!",
  });
});

router.patch("/route/:route_id", async (req, res) => {
  Route.findById(req.params.route_id, function (err, route) {
    if (err) {
      res.status(500).json({ error: err });
    }
    var routedata = req.body;
    delete routedata._id;
    for (let i in routedata) {
      route[i] = routedata[i];
    }
    route
      .save()
      .then(() => {
        res.status(200).json({
          message: "Location changed successfully!",
        });
      })
      .catch((error) => {
        res.status(500).json({
          error: error,
        });
      });
  });
});

router.get("/routeDeparture-by-agent/:admin_id", async (req, res) => {
  const routeDepartures = await RouteDeparture.find()
    .populate("status")
    .populate({
      path: "route",
      model: "Route",
      populate: {
        path:
          "startLocation endLocation startProvince endProvince status vehicle",
        populate: {
          path:
            "startLocation endLocation startProvince endProvince agent type",
        },
      },
    })
    .populate({
      path: "routeSchedule",
      model: "RouteSchedule",
      populate: {
        path: "route",
        model: "Route",
        populate: {
          path:
            "startLocation endLocation startProvince endProvince status vehicle",
          populate: {
            path:
              "startLocation endLocation startProvince endProvince agent type",
          },
        },
      },
    });
  let agentForAdminIds = await getAgentForAdmin(req.params.admin_id);

  let results = [];
  for (let routeDeparture of routeDepartures) {
    if (
      agentForAdminIds.some(
        (e) => e == routeDeparture.route.vehicle.agent._id.toString()
      )
    ) {
      results.push(routeDeparture);
    }
  }
  res.status(200).send(results);
});

router.get("/listbooking/:routeDeparture_id", async (req, res) => {
  var query = { routeDeparture: req.params.routeDeparture_id };
  const listbooking = await Booking.find(query)
    .populate("seatStatus")
    .populate("status");
  res.status(200).send(listbooking);
});

module.exports = router;
