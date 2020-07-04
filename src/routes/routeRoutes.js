const express = require("express");
const mongoose = require("mongoose");
const moment = require('moment');
const { route } = require("./vehicleRoutes");
const { updateLocale } = require("moment");

const Route = mongoose.model("Route");
const RouteDetail = mongoose.model("RouteDetail");
const RouteSchedule = mongoose.model("RouteSchedule");
const RouteDeparture = mongoose.model("RouteDeparture");
const Vehicle = mongoose.model("Vehicle");
const Location = mongoose.model("Location");
const Agent = mongoose.model("Agent");
const Booking = mongoose.model("Booking");
const Const = mongoose.model("Const");

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

var groupNext = function(routeDetails) {
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
}

var byOrder = (a, b) => {
  if (a.orderRouteToStation > b.orderRouteToStation) return 1;
  if (a.orderRouteToStation < b.orderRouteToStation) return -1;
  return 0;
};

router.get("/route", async (req, res) => {
  // const payload = req.query;
  // const date = new Date(payload.departureDate.substring(0, 10) + " 00:00");
  // const routes = await Route.find({
  //   startLocation: payload.startLocation,
  //   endLocation: payload.endLocation,
  //   departureDate: date.toISOString(),
  // })
  //   .populate("startLocation")
  //   .populate("endLocation")
  //   .populate({
  //     path: "vehicle",
  //     populate: {
  //       path: "type",
  //       model: "Const",
  //     },
  //   })
  //   .populate("status");
  // if (routes.length !== 0) {
  //   res.status(200).send(routes);
  // } else {
    const routes = await Route.find()
      .populate("startLocation")
      .populate("endLocation")
      .populate("startProvince")
      .populate("endProvince")
      .populate("status")
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
          path: "startLocation endLocation startProvince endProvince agent type",
        },
      });
    res.status(200).send(routes);
  // }
});

router.get('/find-routes', async (req, resp) => {
  const params = req.query;
  const routeData = {
    startLocation: params.departureLocation,
    endLocation: params.arriveLocation,
    departureDate: params.departureDate,
  };

  let dataFinal = []
  let allRoute = await Route.find();
  let allRouteDetails = await RouteDetail.find().populate('station');
  let allAgents = await Agent.find();
  let departures = await RouteDeparture.find();
  let allBookings = await Booking.find();
  let allLocations = await Location.find();
  let allConst = await Const.find();
  let allSchedules = await RouteSchedule.find();
  var seatStatusUnavailable = await Const.findOne({ type: "trang_thai_ghe", value: "da_dat" });
  let routeDetailByStartLocs = allRouteDetails.filter(e => e.station.stationStop == routeData.startLocation || e.station.province == routeData.startLocation);
  let routes = routeDetailByStartLocs.map(e => e.route);
  let routeDetails = routes.flatMap(e => allRouteDetails.filter(i => i.route.toString() == e.toString()));
  let routeDetailByEndLocs = routeDetails.filter(e => e.station.stationStop == routeData.endLocation || e.station.province == routeData.endLocation);
  if (routeDetailByEndLocs.length == 0) {
    let condition = e => e.station.stationStop == routeData.startLocation ||
      e.station.province == routeData.startLocation ||
      e.station.stationStop == routeData.endLocation ||
      e.station.province == routeData.endLocation;

    let stationByRouteDetails = allRouteDetails.filter(condition);

    let routes = stationByRouteDetails.map(e => e.route);
    stationByRouteDetails = routes.flatMap(e => allRouteDetails.filter(i => i.route.toString() == e.toString()));

    let flatStations = [];
    for (let stationDetail of stationByRouteDetails) {
      if (flatStations.some(e => e.station.stationStop.toString() == stationDetail.station.stationStop.toString())) {
        continue;
      }

      flatStations.push(stationDetail);
    }

    let groupRoutes = groupBy(stationByRouteDetails, 'route');
    let findIndexOfStation = routeDetail => {
      return flatStations.findIndex(e => e.station.stationStop.toString() == routeDetail.station.stationStop.toString())
    };

    let graphStations = new Array(flatStations.length);
    for (let i = 0; i < graphStations.length; i++) {
      graphStations[i] = new Array(flatStations.length).fill({ 
        isAdjacent: false,
        subRoutes: null,
        byRoutes: null
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
            graphStations[x][y] = {
              isAdjacent: true,
              subRoutes: routeStations.slice(i, j),
              byRoutes: [prop]
            };
          }
        }
      }
    }

    let findRoutes = (u, d, visited, paths, pathIndex) => {
      visited[u] = true;
      paths[pathIndex] = u;
      pathIndex++;

      if (u == d) {
        foundRoutes.push(paths.slice(0, pathIndex));
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

    let startIndex = flatStations.findIndex(e => e.station.stationStop.toString() == routeData.startLocation || e.station.province.toString() == routeData.startLocation);
    let endIndex = flatStations.findIndex(e => e.station.stationStop.toString() == routeData.endLocation || e.station.province.toString() == routeData.endLocation);

    let foundRoutes = [];
    findRoutes(startIndex, endIndex, visited, paths, pathIndex);

    let allDetailRoutes = [];
    for (let foundRoute of foundRoutes) {
      let labels = [];
      for (let i = 0; i < foundRoute.length - 1; i++) {
        labels.push({ 
          x: foundRoute[i], 
          y: foundRoute[i + 1], 
          data: graphStations[foundRoute[i]][foundRoute[i + 1]].byRoutes 
        });
      }

      let dataLabels = labels.map(e => e.data);
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
            routeId: flatLabels[0].split('-')[1],
            stationStopId: route1[0].station.stationStop.toString()
          },
          { 
            routeId: flatLabels[0].split('-')[1],
            stationStopId: route1[1].station.stationStop.toString()
          },
          { 
            routeId: flatLabels[1].split('-')[1],
            stationStopId: route2[0].station.stationStop.toString()
          },
        ]);
      } else {
        let n = labels.flatMap(e => e.data).length;
        let subGraph = new Array(n);
        for (let i = 0; i < n; i++) {
          subGraph[i] = new Array(n).fill({
            isAdjacent: false,
            from: null,
            to: null
          });
        }

        for (let i = 0; i < n; i++) {
          let currentLabel = flatLabels[i];
          let groupNumber = parseInt(currentLabel.split('-')[0]);
          let nextGroupNumber = groupNumber + 1;
          for (let j = 0; j < n; j++) {
            if (flatLabels[j].startsWith(nextGroupNumber + '-')) {
              subGraph[i][j] = {
                isAdjacent: true,
                from: flatLabels[i],
                to: flatLabels[j]
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
          if (flatLabels[i].startsWith('0-')) {
            for (let j = flatLabels.length - 1; j >= 0; j--) {
              if (flatLabels[j].startsWith(`${dataLabels.length - 1}-`)) {
                visited = new Array(flatLabels.length).fill(false);
                paths = new Array(flatLabels.length).fill(0);
                currentSubRoutes = [];
                findSubRoutes(i, j, visited, paths, 0);
                currentSubRoutes.forEach(e => foundSubRoutes.push(e));
              }
            }
          }
        }
        
        let mapRoutes = foundSubRoutes.map(e => e.map(i => flatLabels[i].split('-')[1]));
        let detailRoutes = [];
        for (let i = 0; i < mapRoutes.length; i++) {
          let temp = [];
          for (let j = 0; j < mapRoutes[i].length; j++) {
            temp.push({
              routeId: mapRoutes[i][j],
              stationStopId: flatStations[foundRoute[j]].station.stationStop.toString()
            });
          }

          detailRoutes.push(temp);
        }

        detailRoutes.forEach(e => allDetailRoutes.push(e));
      }
    }

    let initTimeOfRoute = (startTime, routeId) => {
      let route = allRoute.find(e => e._id.toString() == routeId);
      let time = route.startTime.split(':');
      
      startTime.add(parseInt(time[0]), 'hours').add(parseInt(time[1]), 'minutes');
      return startTime;
    }

    let getRouteDetail = routeData => {
      return allRouteDetails.find(e => e.station.stationStop == routeData.stationStopId.toString() && e.route == routeData.routeId );
    };

    let findTimeToStation = (time, stationRouteDetail) => {
      let routeDetails = allRouteDetails.filter(e => e.route.toString() == stationRouteDetail.route.toString() && e.orderRouteToStation < stationRouteDetail.orderRouteToStation);
      routeDetails.sort(byOrder);

      for (let detail of routeDetails) {
        time.add(detail.timeArrivingToStation, 'hours');
      }

      return time;
    };

    let findAvalableNextDay = (endTime, routeSchedules) => {
      // Tìm thứ hiện tại
      let dayOfWeek = endTime.day();
      let days = routeSchedules.map(e => e.dayOfWeek);
      days.sort((a, b) => a - b);

      let foundDay;
      let indexOfDayOfWeek = days.indexOf(dayOfWeek);
      if (indexOfDayOfWeek > -1) {
        if (indexOfDayOfWeek == days.length - 1) {
          foundDay = days[0];
        } else {
          foundDay = days[indexOfDayOfWeek + 1];
        }
      } else {
        days.push(dayOfWeek);
        days.sort((a, b) => a - b);

        // Tìm thứ hợp lệ tiếp theo
        if (dayOfWeek == days[days.length - 1]) {
          foundDay = days[0];
        } else {
          foundDay = days[days.indexOf(dayOfWeek) + 1];
        }
      }

      let dayOfWeeks = [0, 1, 2, 3, 4, 5, 6];
      let countDay = 0;
      for (let i = dayOfWeeks.indexOf(dayOfWeek); i < dayOfWeeks.length; i++) {
        countDay++;
        if (dayOfWeeks[i] == foundDay) {
          break;
        }

        if (i == dayOfWeeks.length - 1) {
          i = 0;
        }
      }

      return endTime.add(countDay, 'days');
    };

    let calculateTimeOfNextRoute = (startTime, nextFirstRouteDetail) => {
      let routeSchedules = allSchedules.filter(e => e.route.toString() == nextFirstRouteDetail.route.toString());
      if (routeSchedules.length == 0) {
        console.log(nextFirstRouteDetail.route.toString());
      }
      
      let nowDayOfWeek = startTime.day();

      let now = moment(`${startTime.format('YYYY-MM-DD')} 00:00:00`, "YYYY-MM-DD HH:mm:ss");
      now = initTimeOfRoute(now, nextFirstRouteDetail.route.toString());
      now = findTimeToStation(now, nextFirstRouteDetail);

      // Nếu cùng ngày
      if (routeSchedules.some(e => e.dayOfWeek == nowDayOfWeek)) {
        // Và giờ hợp lệ
        if (now.isAfter(startTime)) {
          return now;
        }
      }

      // Còn ko cùng ngày thì tìm ngày tiếp theo hợp lệ
      return findAvalableNextDay(now, routeSchedules);
    };

    let computeNextRouteTime = (endOfFirstRoute, startOfNextRoute, startTime) => {
      let routeDetailEnd = getRouteDetail(endOfFirstRoute);
      startTime = findTimeToStation(startTime, routeDetailEnd);

      let nextFirstRouteDetail = getRouteDetail(startOfNextRoute);
      return calculateTimeOfNextRoute(startTime, nextFirstRouteDetail);
    };

    let validRoute = [];
    for (let routeItem of allDetailRoutes) {
      let temp = groupNext(routeItem);

      let startTime = new Date(routeData.departureDate);
      startTime = moment(`${startTime.getFullYear()}-${startTime.getMonth() + 1}-${startTime.getDate()} 00:00:00`, "YYYY-MM-DD HH:mm:ss");
      for (let i = 0; i < temp.length - 1; i++) {
        let startOfFirstRoute = temp[i][0];
        let endOfFirstRoute = temp[i][temp[i].length - 1];
        let startOfNextRoute = temp[i + 1][0];

        startTime = initTimeOfRoute(startTime, startOfFirstRoute.routeId);
        startTime = computeNextRouteTime(endOfFirstRoute, startOfNextRoute, startTime);

        routeItem.startTime = startTime;
      }

      validRoute.push(routeItem);
    }

    let sendDateFinalRoute = (routeItem)=>{
      let groupRouteValid = groupNext(routeItem);
      let temp = [];
      let routeDetailByEnd = allRouteDetails.find(e => e.station.stationStop.toString() == routeData.endLocation || e.station.province == routeData.endLocation);
      let endDetail = ({
        routeId : routeDetailByEnd.route.toString(),
        stationStopId: routeDetailByEnd.station.stationStop.toString()
      });
      for(let i = 0; i < groupRouteValid.length; i++){
        let start = groupRouteValid[i][0];
        let end ;
        if(i == groupRouteValid.length - 1){
          end = endDetail;
        }else{
          end = groupRouteValid[i+1][0];
        }
        temp.push({
          routeId: start.routeId,
          startStation : start,
          endStation : end,
          startTime: routeItem.startTime
        })
      }
      return temp;
    }

    let isSameRoute = (routes1, routes2) => {
      if (routes1.length != routes2.length) {
        return false;
      }

      for (let i = 0; i < routes1.length; i++) {
        if (routes1[i].routeId != routes2[i].routeId || routes1[i].startStation.stationStopId != routes2[i].startStation.stationStopId) {
          return false;
        }
      }

      return true;
    };

    let isExistedRoute = (routes, listRoutes) => {
      let sameLengthRoutes = listRoutes.filter(e => e.length == routes.length);
      if (sameLengthRoutes.length > 0) {
        return sameLengthRoutes.some(e => isSameRoute(e, routes));
      }

      return false;
    };

    let dataValidRoute = [];
    for (let routeValidItem of validRoute) {
      let datavalid = sendDateFinalRoute(routeValidItem);
      if (!isExistedRoute(datavalid, dataValidRoute)) {
        dataValidRoute.push(datavalid);
      }
    }

    let findTimeAndPrice = (details, route, startStationId, endStationId) => {
      let start = details.find(e => e.station.stationStop.toString() == startStationId);
      let end = details.find(e => e.station.stationStop.toString() == endStationId);

      let ranges = details.filter(e => e.orderRouteToStation <= end.orderRouteToStation);
      ranges.sort(byOrder);

      let startTimeLength = 0, endTimeLength = 0;
      let disStartLength = 0, disEndLength = 0;
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

      let startTime = route.startTime.split(':');
      let today = new Date();
      let dateToday = today.getDate(), 
        monthToday = today.getMonth() + 1, 
        yearToday = today.getFullYear();

      let startHour = moment(`${yearToday}-${monthToday}-${dateToday} 00:00:00`, "YYYY-MM-DD HH:mm:ss").add(parseInt(startTime[0]), 'hours').add(parseInt(startTime[1]), 'minutes').add(startTimeLength, 'hours');
      let endHour = moment(`${yearToday}-${monthToday}-${dateToday} 00:00:00`, "YYYY-MM-DD HH:mm:ss").add(parseInt(startTime[0]), 'hours').add(parseInt(startTime[1]), 'minutes').add(endTimeLength, 'hours');

      let vehicle = route.vehicle;
      let agent = allAgents.find(e => e._id.toString() == vehicle.agent.toString());
      let pricePerKm = agent.priceToDistance;

      return {
        startHour: startHour,
        endHour: endHour,
        price: (disEndLength - disStartLength) * pricePerKm,
        agentName : agent.name
      }
    };

    let getLocation = locationId => {
      let location = allLocations.find(e => e._id.toString() == locationId);
      return location.address;
    };

    let getDeptAndEmptySeats = (routeId, vehicle) => {
      let departure = departures.find(e => e.route.toString() == routeId && date == e.departureDate.getDate() && month == e.departureDate.getMonth() && year == departureDate.getFullYear());
      let totalSeats = vehicle.totalSeats;
      let depId = null, emptySeats = totalSeats;
      if (departure) {
        depId = departure._id.toString();
        let bookedSeats = allBookings.find(e => e.routeuDeparture.toString() == departure._id.toString() && e.seatStatus.toString() == seatStatusUnavailable._id.toString()).length;
        emptySeats = totalSeats - bookedSeats;
      }

      return {
        depId: depId,
        emptySeats: emptySeats
      }
    };

    let mapRouteToDataFinal = async (routeDetail, isFirstRoute = false) => {
      // Check first route
      let query = {
        '$and': [
          { 'route': routeDetail.routeId }
        ]
      };

      if (isFirstRoute) {
        query['$and'].push({ 'dayOfWeek': new Date(routeData.departureDate).getDay() });
      }

      var schedule = await RouteSchedule.findOne(query);
      if (!schedule) {
        return null;
      }

      // Get route with vehicle
      let route = await Route.findById(routeDetail.routeId).populate('vehicle');

      // Get route details
      let routeDetails = allRouteDetails.filter(e => e.route.toString() == route._id.toString());

      // Get additional data
      let today = new Date();
      let dateToday = today.getDate(), monthToday = today.getMonth() + 1, yearToday = today.getFullYear();

      let selectedDate = new Date(routeData.departureDate);
      let date = selectedDate.getDate();
      let month = selectedDate.getMonth() + 1;
      let year = selectedDate.getFullYear();

      let startAddress = getLocation(routeDetail.startStation.stationStopId);
      let endAddress = getLocation(routeDetail.endStation.stationStopId);
      
      let timeAndPrice = findTimeAndPrice(routeDetails, route, routeDetail.startStation.stationStopId, routeDetail.endStation.stationStopId);
      let deptAndSeats = getDeptAndEmptySeats(route._id.toString(), route.vehicle);

      let typeVehicle = allConst.find(e => e._id.toString() == route.vehicle.type.toString());

      if (dateToday == date && monthToday == month && yearToday == year) {
        let hourToday = today.getHours();
        let minuteToday = today.getMinutes();
        let temp = moment(`${yearToday}-${monthToday}-${dateToday} ${hourToday}:${minuteToday}:00`, "YYYY-MM-DD HH:mm:ss").add(0.5, 'hours');
        if (!temp.isBefore(timeAndPrice.startHour, 'hours')) {
          return null;
        }
      }

      return {
        '_id': route._id.toString(),
        'vehicle': route.vehicle,
        'typeVehicle' : typeVehicle,
        'agentName': timeAndPrice.agentName,
        'startLocation': startAddress,
        'endLocation': endAddress,
        'startDay': routeDetail.startTime,
        'startTime': timeAndPrice.startHour.format('HH:mm'),
        'endTime': timeAndPrice.endHour.format('HH:mm'),
        'price': timeAndPrice.price,
        'departureId': deptAndSeats.depId,
        'emptySeats': deptAndSeats.emptySeats
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

        dataFinal.push(mapRoutes);
      }
    }

    return resp.send(dataFinal);
  }

  routes = routeDetailByEndLocs.map(e => e.route);
  routeDetails = routes.flatMap(e => allRouteDetails.filter(i => i.route.toString() == e.toString()));
  let routeDetailGroups = groupBy(routeDetails, 'route');

  let finalRouteDetails = [];
  for (prop in routeDetailGroups) {
    let start = routeDetailGroups[prop].find(e => e.station.stationStop == routeData.startLocation || e.station.province == routeData.startLocation);
    let end = routeDetailGroups[prop].find(e => e.station.stationStop == routeData.endLocation || e.station.province == routeData.endLocation);

    if (start.orderRouteToStation < end.orderRouteToStation) {
      finalRouteDetails = finalRouteDetails.concat(routeDetailGroups[prop]);
    }
  }

  routes = [...new Set(finalRouteDetails.map(e => e.route.toString()))];
  let schedules = await RouteSchedule.find({
    '$and': [
      { 'route': { '$in': routes } },
      { 'dayOfWeek': new Date(routeData.departureDate).getDay() }
    ]
  });

  routes = schedules.map(e => e.route);
  routes = await Route.find({ '_id': { '$in': routes } }).populate('vehicle');

  routeDetails = routes.flatMap(e => allRouteDetails.filter(i => i.route.toString() == e._id.toString()));
  routeDetailGroups = groupBy(routeDetails, 'route');

  for (prop in routeDetailGroups) {
    let details = routeDetailGroups[prop];

    let start = details.find(e => e.station.stationStop == routeData.startLocation || e.station.province == routeData.startLocation);
    let end = details.find(e => e.station.stationStop == routeData.endLocation || e.station.province == routeData.endLocation);

    let startAddress = allLocations.find(e => e._id == start.station.stationStop.toString()).address;
    let endAddress = allLocations.find(e => e._id == end.station.stationStop.toString()).address;


    let ranges = details.filter(e => e.orderRouteToStation <= end.orderRouteToStation);
    ranges.sort(byOrder);

    let startTimeLength = 0, endTimeLength = 0;
    let disStartLength = 0, disEndLength = 0;
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

    let route = routes.find(e => e._id.toString() == prop);
    let startTime = route.startTime.split(':');
    let today = new Date();
    let dateToday = today.getDate(), monthToday = today.getMonth() + 1, yearToday = today.getFullYear();

    let startHour = moment(`${yearToday}-${monthToday}-${dateToday} 00:00:00`, "YYYY-MM-DD HH:mm:ss").add(parseInt(startTime[0]), 'hours').add(parseInt(startTime[1]), 'minutes').add(startTimeLength, 'hours');
    let endHour = moment(`${yearToday}-${monthToday}-${dateToday} 00:00:00`, "YYYY-MM-DD HH:mm:ss").add(parseInt(startTime[0]), 'hours').add(parseInt(startTime[1]), 'minutes').add(endTimeLength, 'hours');

    let vehicle = route.vehicle;
    let typeVehicle = allConst.find(e => e._id.toString() == vehicle.type.toString());
    let agent = allAgents.find(e => e._id.toString() == vehicle.agent.toString());
    let pricePerKm = agent.priceToDistance;

    let selectedDate = new Date(routeData.departureDate);
    let date = selectedDate.getDate();
    let month = selectedDate.getMonth() + 1;
    let year = selectedDate.getFullYear();

    let departure = departures.find(e => e.route.toString() == prop && date == e.departureDate.getDate() && month == e.departureDate.getMonth() && year == departureDate.getFullYear());
    let totalSeats = vehicle.totalSeats;
    let depId = null, emptySeats = totalSeats;
    if (departure) {
      depId = departure._id.toString();
      let bookedSeats = allBookings.find(e => e.routeuDeparture.toString() == departure._id.toString() && e.seatStatus.toString() == seatStatusUnavailable._id.toString()).length;
      emptySeats = totalSeats - bookedSeats;
    }

    let valid = true;
    if (dateToday == date && monthToday == month && yearToday == year) {
      let hourToday = today.getHours();
      let minuteToday = today.getMinutes();
      let temp = moment(`${yearToday}-${monthToday}-${dateToday} ${hourToday}:${minuteToday}:00`, "YYYY-MM-DD HH:mm:ss").add(2, 'hours');
      if (!temp.isBefore(startHour, 'hours')) {
        valid = false;
      }
    }

    if (valid) {
      dataFinal.push([{
        '_id': prop,
        'vehicle': vehicle,
        'typeVehicle' : typeVehicle,
        'agentName' : agent.name,
        'startLocation': startAddress,
        'endLocation': endAddress,
        'startTime': startHour.format('HH:mm'),
        'endTime': endHour.format('HH:mm'),
        'price': (disEndLength - disStartLength) * pricePerKm,
        'departureId': depId,
        'emptySeats': emptySeats
      }]);
    }
  }

  return resp.send(dataFinal);
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
    isCorrectRoute: data.isCorrectRoute
  });

  await route.save();

  let length = data.stationId.length;
  for (let i = 0; i < length; i++) {
    const routeDetail = new RouteDetail({
      route: route._id,
      station: data.stationId[i],
      timeArrivingToStation: data.stationTime[i],
      distanceToStation: data.stationDistance[i],
      orderRouteToStation: data.orderStation[i]
    });
    await routeDetail.save();
  }

  let lenghtDay = data.day.length;
  for (let i = 0; i < lenghtDay; i++) {
    const routeSchedule = new RouteSchedule({
      route: route._id,
      dayOfWeek: data.day[i]
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

module.exports = router;
