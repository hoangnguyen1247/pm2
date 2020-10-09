"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _systeminformation = _interopRequireDefault(require("systeminformation"));

var _psList = _interopRequireDefault(require("./psList"));

var _async = _interopRequireDefault(require("async"));

var _MeanCalc = _interopRequireDefault(require("./MeanCalc"));

var _child_process = require("child_process");

var _os = _interopRequireDefault(require("os"));

var _fs = _interopRequireDefault(require("fs"));

var _debug = _interopRequireDefault(require("debug"));

var debug = (0, _debug["default"])('pm2:sysinfos');
var DEFAULT_CONVERSION = 1024 * 1024;

var SystemInfo = /*#__PURE__*/function () {
  function SystemInfo() {
    (0, _classCallCheck2["default"])(this, SystemInfo);
    (0, _defineProperty2["default"])(this, "infos", void 0);
    (0, _defineProperty2["default"])(this, "ping_timeout", void 0);
    (0, _defineProperty2["default"])(this, "restart", void 0);
    (0, _defineProperty2["default"])(this, "process", void 0);
    this.infos = {
      baseboard: {
        model: null,
        version: null
      },
      cpu: {
        manufacturer: null,
        brand: null,
        speedmax: null,
        cores: null,
        physicalCores: null,
        processors: null,
        temperature: null,
        usage: null
      },
      mem: {
        total: null,
        free: null,
        active: null
      },
      os: {
        platform: null,
        distro: null,
        release: null,
        codename: null,
        kernel: null,
        arch: null
      },
      fd: {
        opened: null,
        max: null
      },
      storage: {
        io: {
          read: new _MeanCalc["default"](15),
          write: new _MeanCalc["default"](15)
        },
        physical_disks: [{
          device: null,
          type: null,
          name: null,
          interfaceType: null,
          vendor: null
        }],
        filesystems: [{}]
      },
      connections: ['source_ip:source_port-dest_ip:dest_port-proc_name'],
      network: {
        latency: new _MeanCalc["default"](5),
        tx_5: new _MeanCalc["default"](5),
        rx_5: new _MeanCalc["default"](5),
        rx_errors_60: new _MeanCalc["default"](60),
        tx_errors_60: new _MeanCalc["default"](60),
        tx_dropped_60: new _MeanCalc["default"](60),
        rx_dropped_60: new _MeanCalc["default"](60)
      },
      // Procs
      containers: [],
      processes: {
        cpu_sorted: null,
        mem_sorted: null
      },
      services: {
        running: null,
        stopped: null
      }
    };
    this.restart = true;
    this.ping_timeout = null;
  } // Cast MeanCalc and other object to real value
  // This method retrieve the machine snapshot well formated


  (0, _createClass2["default"])(SystemInfo, [{
    key: "report",
    value: function report() {
      var report = JSON.parse(JSON.stringify(this.infos));
      report.network.latency = this.infos.network.latency.val();
      report.network.tx_5 = this.infos.network.tx_5.val();
      report.network.rx_5 = this.infos.network.rx_5.val();
      report.network.rx_errors_60 = this.infos.network.rx_errors_60.val();
      report.network.tx_errors_60 = this.infos.network.tx_errors_60.val();
      report.network.rx_dropped_60 = this.infos.network.rx_dropped_60.val();
      report.network.tx_dropped_60 = this.infos.network.tx_dropped_60.val();
      report.storage.io.read = this.infos.storage.io.read.val();
      report.storage.io.write = this.infos.storage.io.write.val();
      return report;
    }
  }, {
    key: "fork",
    value: function fork() {
      var _this = this;

      this.process = (0, _child_process.fork)(__filename, {
        detached: false,
        windowsHide: true,
        stdio: ['inherit', 'inherit', 'inherit', 'ipc']
      });
      this.process.on('exit', function (code) {
        console.log("systeminfos collection process offline with code ".concat(code)); // if (this.restart == true)
        //   this.fork()
      });
      this.process.on('error', function (e) {
        console.log("Sysinfo errored", e);
      });
      this.process.on('message', function (msg) {
        try {
          msg = JSON.parse(msg);
        } catch (e) {}

        if (msg.cmd == 'ping') {
          if (_this.process.connected == true) {
            try {
              _this.process.send('pong');
            } catch (e) {
              console.error('Cannot send message to Sysinfos');
            }
          }
        }
      });
    }
  }, {
    key: "query",
    value: function query(cb) {
      if (this.process.connected == true) {
        try {
          this.process.send('query');
        } catch (e) {
          return cb(new Error('not ready yet'), null);
        }
      } else return cb(new Error('not ready yet'), null);

      var res = function res(msg) {
        try {
          msg = JSON.parse(msg);
        } catch (e) {}

        if (msg.cmd == 'query:res') {
          listener.removeListener('message', res);
          return cb(null, msg.data);
        }
      };

      var listener = this.process.on('message', res);
    }
  }, {
    key: "kill",
    value: function kill() {
      this.restart = false;
      this.process.kill();
    }
  }, {
    key: "startCollection",
    value: function startCollection() {
      var _this2 = this;

      this.staticInformations();

      var _dockerCollection, _processCollection, _memCollection, servicesCollection;

      (_dockerCollection = function dockerCollection() {
        _this2.dockerSummary(function () {
          setTimeout(_dockerCollection.bind(_this2), 300);
        });
      })();

      (_processCollection = function processCollection() {
        _this2.processesSummary(function () {
          setTimeout(_processCollection.bind(_this2), 5000);
        });
      })(); // (servicesCollection = () => {
      //   this.servicesSummary(() => {
      //     setTimeout(servicesCollection.bind(this), 60000)
      //   })
      // })();


      (_memCollection = function memCollection() {
        _this2.memStats(function () {
          setTimeout(_memCollection.bind(_this2), 1000);
        });
      })();

      this.networkConnectionsWorker();
      this.disksStatsWorker();
      this.networkStatsWorker();
      this.cpuStatsWorker();
      this.fdStatsWorker();
      setInterval(function () {
        if (process.connected == false) {
          console.error('Sysinfos not connected, exiting');
          process.exit();
        }

        try {
          process.send(JSON.stringify({
            cmd: 'ping'
          }));
        } catch (e) {
          console.error('PM2 is dead while doing process.send');
          process.exit();
        }

        _this2.ping_timeout = setTimeout(function () {
          console.error('PM2 is dead while waiting for a pong');
          process.exit();
        }, 2000);
      }, 3000); // Systeminfo receive command

      process.on('message', function (cmd) {
        if (cmd == 'query') {
          try {
            var res = JSON.stringify({
              cmd: 'query:res',
              data: _this2.report()
            });
            process.send(res);
          } catch (e) {
            console.error('Could not retrieve system informations', e);
          }
        } else if (cmd == 'pong') {
          clearTimeout(_this2.ping_timeout);
        }
      });
    }
  }, {
    key: "staticInformations",
    value: function staticInformations() {
      var _this3 = this;

      var getCPU = function getCPU() {
        return _systeminformation["default"].cpu().then(function (data) {
          _this3.infos.cpu = {
            brand: data.manufacturer,
            model: data.brand,
            speed: data.speedmax,
            cores: data.cores,
            physicalCores: data.physicalCores
          };
        });
      };

      var getBaseboard = function getBaseboard() {
        return _systeminformation["default"].system().then(function (data) {
          _this3.infos.baseboard = {
            manufacturer: data.manufacturer,
            model: data.model,
            version: data.version
          };
        });
      };

      var getOsInfo = function getOsInfo() {
        return _systeminformation["default"].osInfo().then(function (data) {
          _this3.infos.os = {
            platform: data.platform,
            distro: data.distro,
            release: data.release,
            codename: data.codename,
            kernel: data.kernel,
            arch: data.arch
          };
        });
      };

      var diskLayout = function diskLayout() {
        _this3.infos.storage.physical_disks = [];
        return _systeminformation["default"].diskLayout().then(function (disks) {
          disks.forEach(function (disk) {
            _this3.infos.storage.physical_disks.push({
              device: disk.device,
              type: disk.type,
              name: disk.name,
              interfaceType: disk.interfaceType,
              vendor: disk.vendor
            });
          });
        });
      };

      getBaseboard().then(getCPU).then(getOsInfo).then(diskLayout)["catch"](function (e) {
        debug("Error when trying to retrieve static informations", e);
      });
    }
  }, {
    key: "dockerSummary",
    value: function dockerSummary() {
      var _this4 = this;

      var cb = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function () {};

      _systeminformation["default"].dockerContainers(true).then(function (containers) {
        var non_exited_containers = containers.filter(function (container) {
          return container.state != 'exited';
        });
        var new_containers = [];

        _async["default"].forEach(non_exited_containers, function (container, next) {
          _systeminformation["default"].dockerContainerStats(container.id).then(function (stats) {
            var meta = container;
            stats[0].cpu_percent = stats[0].cpu_percent.toFixed(1);
            stats[0].mem_percent = stats[0].mem_percent.toFixed(1);
            stats[0].netIO.tx = (stats[0].netIO.tx / DEFAULT_CONVERSION).toFixed(1);
            stats[0].netIO.rx = (stats[0].netIO.rx / DEFAULT_CONVERSION).toFixed(1);
            stats[0].blockIO.w = (stats[0].blockIO.w / DEFAULT_CONVERSION).toFixed(1);
            stats[0].blockIO.r = (stats[0].blockIO.r / DEFAULT_CONVERSION).toFixed(1);
            meta.stats = Array.isArray(stats) == true ? stats[0] : null;
            new_containers.push(meta);
            next();
          })["catch"](function (e) {
            debug(e);
            next();
          });
        }, function (err) {
          if (err) debug(err);
          _this4.infos.containers = new_containers.sort(function (a, b) {
            var textA = a.name.toUpperCase();
            var textB = b.name.toUpperCase();
            return textA < textB ? -1 : textA > textB ? 1 : 0;
          });
          return cb();
        });
      })["catch"](function (e) {
        debug(e);
        return cb();
      });
    }
  }, {
    key: "servicesSummary",
    value: function servicesSummary() {
      var _this5 = this;

      _systeminformation["default"].services('*').then(function (services) {
        _this5.infos.services.running = services.filter(function (service) {
          return service.running === true;
        });
        _this5.infos.services.stopped = services.filter(function (service) {
          return service.running === false;
        });
      })["catch"](function (e) {
        debug(e);
      });
    }
  }, {
    key: "processesSummary",
    value: function processesSummary(cb) {
      var _this6 = this;

      (0, _psList["default"])().then(function (processes) {
        _this6.infos.processes.cpu_sorted = processes.filter(function (a) {
          return !(a.cmd.includes('SystemInfo') && a.cmd.includes('PM2'));
        }).sort(function (a, b) {
          return b.cpu - a.cpu;
        }).slice(0, 5);
        _this6.infos.processes.mem_sorted = processes.filter(function (a) {
          return !(a.cmd.includes('SystemInfo') && a.cmd.includes('PM2'));
        }).sort(function (a, b) {
          return b.memory - a.memory;
        }).slice(0, 5);
        return cb();
      })["catch"](function (e) {
        debug("Error when retrieving process list", e);
        return cb();
      });
    }
  }, {
    key: "cpuStatsWorker",
    value: function cpuStatsWorker() {
      var _this7 = this;

      var _cpuTempCollection;

      (_cpuTempCollection = function cpuTempCollection() {
        _systeminformation["default"].cpuTemperature().then(function (data) {
          _this7.infos.cpu.temperature = data.main;
          setTimeout(_cpuTempCollection.bind(_this7), 2000);
        })["catch"](function (e) {
          setTimeout(_cpuTempCollection.bind(_this7), 2000);
        });
      })();

      function fetch() {
        var _this8 = this;

        var startMeasure = computeUsage();
        setTimeout(function (_) {
          var endMeasure = computeUsage();
          var idleDifference = endMeasure.idle - startMeasure.idle;
          var totalDifference = endMeasure.total - startMeasure.total;
          var percentageCPU = (10000 - Math.round(10000 * idleDifference / totalDifference)) / 100;
          _this8.infos.cpu.usage = percentageCPU.toFixed(1);
        }, 100);
      }

      function computeUsage() {
        var totalIdle = 0;
        var totalTick = 0;

        var cpus = _os["default"].cpus();

        for (var i = 0, len = cpus.length; i < len; i++) {
          var cpu = cpus[i];

          for (var type in cpu.times) {
            totalTick += cpu.times[type];
          }

          totalIdle += cpu.times.idle;
        }

        return {
          idle: parseInt(totalIdle / cpus.length + ""),
          total: parseInt(totalTick / cpus.length + "")
        };
      }

      setInterval(fetch.bind(this), 1000);
      fetch.bind(this)();
    }
  }, {
    key: "memStats",
    value: function memStats(cb) {
      var _this9 = this;

      _systeminformation["default"].mem().then(function (data) {
        _this9.infos.mem.total = (data.total / DEFAULT_CONVERSION).toFixed(2);
        _this9.infos.mem.free = (data.free / DEFAULT_CONVERSION).toFixed(2);
        _this9.infos.mem.active = (data.active / DEFAULT_CONVERSION).toFixed(2);
        _this9.infos.mem.available = (data.available / DEFAULT_CONVERSION).toFixed(2);
        return cb();
      })["catch"](function (e) {
        debug("Error while getting memory info", e);
        return cb();
      });
    }
  }, {
    key: "networkConnectionsWorker",
    value: function networkConnectionsWorker() {
      var _this10 = this;

      var _retrieveConn;

      (_retrieveConn = function retrieveConn() {
        _systeminformation["default"].networkConnections().then(function (conns) {
          _this10.infos.connections = conns.filter(function (conn) {
            return conn.localport != '443' && conn.peerport != '443';
          }).map(function (conn) {
            return "".concat(conn.localaddress, ":").concat(conn.localport, "-").concat(conn.peeraddress, ":").concat(conn.peerport, "-").concat(conn.proc ? conn.proc : 'unknown');
          });
          setTimeout(_retrieveConn.bind(_this10), 10 * 1000);
        })["catch"](function (e) {
          debug("Error while retrieving filesystem infos", e);
          setTimeout(_retrieveConn.bind(_this10), 10 * 1000);
        });
      })();
    }
  }, {
    key: "disksStatsWorker",
    value: function disksStatsWorker() {
      var _this11 = this;

      var rx = 0;
      var wx = 0;
      var started = false;

      var _fsSizeCollection, _ioCollection;

      (_fsSizeCollection = function fsSizeCollection() {
        _systeminformation["default"].fsSize().then(function (fss) {
          var fse = fss.filter(function (fs) {
            return fs.size / (1024 * 1024) > 200;
          });
          _this11.infos.storage.filesystems = fse;
          setTimeout(_fsSizeCollection.bind(_this11), 30 * 1000);
        })["catch"](function (e) {
          debug("Error while retrieving filesystem infos", e);
          setTimeout(_fsSizeCollection.bind(_this11), 10 * 1000);
        });
      })();

      (_ioCollection = function ioCollection() {
        _systeminformation["default"].fsStats().then(function (fs_stats) {
          var new_rx = fs_stats.rx;
          var new_wx = fs_stats.wx;
          var read = ((new_rx - rx) / DEFAULT_CONVERSION).toFixed(3);
          var write = ((new_wx - wx) / DEFAULT_CONVERSION).toFixed(3);

          if (started == true) {
            _this11.infos.storage.io.read.add(parseFloat(read));

            _this11.infos.storage.io.write.add(parseFloat(write));
          }

          rx = new_rx;
          wx = new_wx;
          started = true;
          setTimeout(_ioCollection.bind(_this11), 1000);
        })["catch"](function (e) {
          debug("Error while getting network statistics", e);
          setTimeout(_ioCollection.bind(_this11), 1000);
        });
      })();
    }
  }, {
    key: "fdStatsWorker",
    value: function fdStatsWorker() {
      var _this12 = this;

      var getFDOpened = function getFDOpened() {
        _fs["default"].readFile('/proc/sys/fs/file-nr', function (err, out) {
          if (err) return;
          var output = out.toString().trim();
          var parsed = output.split('\t');
          if (parsed.length !== 3) return;
          _this12.infos.fd.opened = parseInt(parsed[0]);
          _this12.infos.fd.max = parseInt(parsed[2]);
        });
      };

      setInterval(function () {
        getFDOpened();
      }, 20 * 1000);
      getFDOpened();
    }
  }, {
    key: "networkStatsWorker",
    value: function networkStatsWorker() {
      var _this13 = this;

      var latencyCollection, _networkStatsCollection; // (latencyCollection = () => {
      //   sysinfo.inetLatency()
      //     .then(latency => {
      //       this.infos.network.latency.add(latency)
      //       setTimeout(latencyCollection.bind(this), 2000)
      //     })
      //     .catch(e => {
      //       debug(e)
      //       setTimeout(latencyCollection.bind(this), 2000)
      //     })
      // })()


      _systeminformation["default"].networkInterfaceDefault(function (net_interface) {
        var started = false;
        var rx = 0;
        var tx = 0;
        var rx_e = 0;
        var tx_e = 0;
        var rx_d = 0;
        var tx_d = 0;

        (_networkStatsCollection = function networkStatsCollection() {
          _systeminformation["default"].networkStats(net_interface).then(function (net) {
            var new_rx = (net[0].rx_bytes - rx) / DEFAULT_CONVERSION;
            var new_tx = (net[0].tx_bytes - tx) / DEFAULT_CONVERSION;
            rx = net[0].rx_bytes;
            tx = net[0].tx_bytes;
            var new_rx_e = (net[0].rx_errors - rx_e) / DEFAULT_CONVERSION;
            var new_tx_e = (net[0].tx_errors - tx_e) / DEFAULT_CONVERSION;
            rx_e = net[0].rx_errors;
            tx_e = net[0].tx_errors;
            var new_rx_d = (net[0].rx_dropped - rx_d) / DEFAULT_CONVERSION;
            var new_tx_d = (net[0].tx_dropped - tx_d) / DEFAULT_CONVERSION;
            rx_d = net[0].rx_dropped;
            tx_d = net[0].tx_dropped;

            if (started == true) {
              _this13.infos.network.rx_5.add(new_rx);

              _this13.infos.network.tx_5.add(new_tx);

              _this13.infos.network.rx_errors_60.add(new_rx_e);

              _this13.infos.network.tx_errors_60.add(new_tx_e);

              _this13.infos.network.rx_dropped_60.add(new_rx_d);

              _this13.infos.network.tx_dropped_60.add(new_tx_d);
            }

            started = true;
            setTimeout(_networkStatsCollection.bind(_this13), 1000);
          })["catch"](function (e) {
            debug("Error on retrieving network stats", e);
            setTimeout(_networkStatsCollection.bind(_this13), 900);
          });
        })();
      });
    }
  }]);
  return SystemInfo;
}();

if (require.main === module) {
  var sys = new SystemInfo();
  sys.startCollection();
}

var _default = SystemInfo;
exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9TeXNpbmZvL1N5c3RlbUluZm8udHMiXSwibmFtZXMiOlsiZGVidWciLCJERUZBVUxUX0NPTlZFUlNJT04iLCJTeXN0ZW1JbmZvIiwiaW5mb3MiLCJiYXNlYm9hcmQiLCJtb2RlbCIsInZlcnNpb24iLCJjcHUiLCJtYW51ZmFjdHVyZXIiLCJicmFuZCIsInNwZWVkbWF4IiwiY29yZXMiLCJwaHlzaWNhbENvcmVzIiwicHJvY2Vzc29ycyIsInRlbXBlcmF0dXJlIiwidXNhZ2UiLCJtZW0iLCJ0b3RhbCIsImZyZWUiLCJhY3RpdmUiLCJvcyIsInBsYXRmb3JtIiwiZGlzdHJvIiwicmVsZWFzZSIsImNvZGVuYW1lIiwia2VybmVsIiwiYXJjaCIsImZkIiwib3BlbmVkIiwibWF4Iiwic3RvcmFnZSIsImlvIiwicmVhZCIsIk1lYW5DYWxjIiwid3JpdGUiLCJwaHlzaWNhbF9kaXNrcyIsImRldmljZSIsInR5cGUiLCJuYW1lIiwiaW50ZXJmYWNlVHlwZSIsInZlbmRvciIsImZpbGVzeXN0ZW1zIiwiY29ubmVjdGlvbnMiLCJuZXR3b3JrIiwibGF0ZW5jeSIsInR4XzUiLCJyeF81IiwicnhfZXJyb3JzXzYwIiwidHhfZXJyb3JzXzYwIiwidHhfZHJvcHBlZF82MCIsInJ4X2Ryb3BwZWRfNjAiLCJjb250YWluZXJzIiwicHJvY2Vzc2VzIiwiY3B1X3NvcnRlZCIsIm1lbV9zb3J0ZWQiLCJzZXJ2aWNlcyIsInJ1bm5pbmciLCJzdG9wcGVkIiwicmVzdGFydCIsInBpbmdfdGltZW91dCIsInJlcG9ydCIsIkpTT04iLCJwYXJzZSIsInN0cmluZ2lmeSIsInZhbCIsInByb2Nlc3MiLCJfX2ZpbGVuYW1lIiwiZGV0YWNoZWQiLCJ3aW5kb3dzSGlkZSIsInN0ZGlvIiwib24iLCJjb2RlIiwiY29uc29sZSIsImxvZyIsImUiLCJtc2ciLCJjbWQiLCJjb25uZWN0ZWQiLCJzZW5kIiwiZXJyb3IiLCJjYiIsIkVycm9yIiwicmVzIiwibGlzdGVuZXIiLCJyZW1vdmVMaXN0ZW5lciIsImRhdGEiLCJraWxsIiwic3RhdGljSW5mb3JtYXRpb25zIiwiZG9ja2VyQ29sbGVjdGlvbiIsInByb2Nlc3NDb2xsZWN0aW9uIiwibWVtQ29sbGVjdGlvbiIsInNlcnZpY2VzQ29sbGVjdGlvbiIsImRvY2tlclN1bW1hcnkiLCJzZXRUaW1lb3V0IiwiYmluZCIsInByb2Nlc3Nlc1N1bW1hcnkiLCJtZW1TdGF0cyIsIm5ldHdvcmtDb25uZWN0aW9uc1dvcmtlciIsImRpc2tzU3RhdHNXb3JrZXIiLCJuZXR3b3JrU3RhdHNXb3JrZXIiLCJjcHVTdGF0c1dvcmtlciIsImZkU3RhdHNXb3JrZXIiLCJzZXRJbnRlcnZhbCIsImV4aXQiLCJjbGVhclRpbWVvdXQiLCJnZXRDUFUiLCJzeXNpbmZvIiwidGhlbiIsInNwZWVkIiwiZ2V0QmFzZWJvYXJkIiwic3lzdGVtIiwiZ2V0T3NJbmZvIiwib3NJbmZvIiwiZGlza0xheW91dCIsImRpc2tzIiwiZm9yRWFjaCIsImRpc2siLCJwdXNoIiwiZG9ja2VyQ29udGFpbmVycyIsIm5vbl9leGl0ZWRfY29udGFpbmVycyIsImZpbHRlciIsImNvbnRhaW5lciIsInN0YXRlIiwibmV3X2NvbnRhaW5lcnMiLCJhc3luYyIsIm5leHQiLCJkb2NrZXJDb250YWluZXJTdGF0cyIsImlkIiwic3RhdHMiLCJtZXRhIiwiY3B1X3BlcmNlbnQiLCJ0b0ZpeGVkIiwibWVtX3BlcmNlbnQiLCJuZXRJTyIsInR4IiwicngiLCJibG9ja0lPIiwidyIsInIiLCJBcnJheSIsImlzQXJyYXkiLCJlcnIiLCJzb3J0IiwiYSIsImIiLCJ0ZXh0QSIsInRvVXBwZXJDYXNlIiwidGV4dEIiLCJzZXJ2aWNlIiwiaW5jbHVkZXMiLCJzbGljZSIsIm1lbW9yeSIsImNwdVRlbXBDb2xsZWN0aW9uIiwiY3B1VGVtcGVyYXR1cmUiLCJtYWluIiwiZmV0Y2giLCJzdGFydE1lYXN1cmUiLCJjb21wdXRlVXNhZ2UiLCJfIiwiZW5kTWVhc3VyZSIsImlkbGVEaWZmZXJlbmNlIiwiaWRsZSIsInRvdGFsRGlmZmVyZW5jZSIsInBlcmNlbnRhZ2VDUFUiLCJNYXRoIiwicm91bmQiLCJ0b3RhbElkbGUiLCJ0b3RhbFRpY2siLCJjcHVzIiwiaSIsImxlbiIsImxlbmd0aCIsInRpbWVzIiwicGFyc2VJbnQiLCJhdmFpbGFibGUiLCJyZXRyaWV2ZUNvbm4iLCJuZXR3b3JrQ29ubmVjdGlvbnMiLCJjb25ucyIsImNvbm4iLCJsb2NhbHBvcnQiLCJwZWVycG9ydCIsIm1hcCIsImxvY2FsYWRkcmVzcyIsInBlZXJhZGRyZXNzIiwicHJvYyIsInd4Iiwic3RhcnRlZCIsImZzU2l6ZUNvbGxlY3Rpb24iLCJpb0NvbGxlY3Rpb24iLCJmc1NpemUiLCJmc3MiLCJmc2UiLCJmcyIsInNpemUiLCJmc1N0YXRzIiwiZnNfc3RhdHMiLCJuZXdfcngiLCJuZXdfd3giLCJhZGQiLCJwYXJzZUZsb2F0IiwiZ2V0RkRPcGVuZWQiLCJyZWFkRmlsZSIsIm91dCIsIm91dHB1dCIsInRvU3RyaW5nIiwidHJpbSIsInBhcnNlZCIsInNwbGl0IiwibGF0ZW5jeUNvbGxlY3Rpb24iLCJuZXR3b3JrU3RhdHNDb2xsZWN0aW9uIiwibmV0d29ya0ludGVyZmFjZURlZmF1bHQiLCJuZXRfaW50ZXJmYWNlIiwicnhfZSIsInR4X2UiLCJyeF9kIiwidHhfZCIsIm5ldHdvcmtTdGF0cyIsIm5ldCIsInJ4X2J5dGVzIiwibmV3X3R4IiwidHhfYnl0ZXMiLCJuZXdfcnhfZSIsInJ4X2Vycm9ycyIsIm5ld190eF9lIiwidHhfZXJyb3JzIiwibmV3X3J4X2QiLCJyeF9kcm9wcGVkIiwibmV3X3R4X2QiLCJ0eF9kcm9wcGVkIiwicmVxdWlyZSIsIm1vZHVsZSIsInN5cyIsInN0YXJ0Q29sbGVjdGlvbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUEsSUFBTUEsS0FBSyxHQUFHLHVCQUFZLGNBQVosQ0FBZDtBQUVBLElBQU1DLGtCQUFrQixHQUFHLE9BQU8sSUFBbEM7O0lBRU1DLFU7QUFNSix3QkFBYztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFDWixTQUFLQyxLQUFMLEdBQWE7QUFDWEMsTUFBQUEsU0FBUyxFQUFFO0FBQ1RDLFFBQUFBLEtBQUssRUFBRSxJQURFO0FBRVRDLFFBQUFBLE9BQU8sRUFBRTtBQUZBLE9BREE7QUFLWEMsTUFBQUEsR0FBRyxFQUFFO0FBQ0hDLFFBQUFBLFlBQVksRUFBRSxJQURYO0FBRUhDLFFBQUFBLEtBQUssRUFBRSxJQUZKO0FBR0hDLFFBQUFBLFFBQVEsRUFBRSxJQUhQO0FBSUhDLFFBQUFBLEtBQUssRUFBRSxJQUpKO0FBS0hDLFFBQUFBLGFBQWEsRUFBRSxJQUxaO0FBTUhDLFFBQUFBLFVBQVUsRUFBRSxJQU5UO0FBT0hDLFFBQUFBLFdBQVcsRUFBRSxJQVBWO0FBUUhDLFFBQUFBLEtBQUssRUFBRTtBQVJKLE9BTE07QUFlWEMsTUFBQUEsR0FBRyxFQUFFO0FBQ0hDLFFBQUFBLEtBQUssRUFBRSxJQURKO0FBRUhDLFFBQUFBLElBQUksRUFBRSxJQUZIO0FBR0hDLFFBQUFBLE1BQU0sRUFBRTtBQUhMLE9BZk07QUFvQlhDLE1BQUFBLEVBQUUsRUFBRTtBQUNGQyxRQUFBQSxRQUFRLEVBQUUsSUFEUjtBQUVGQyxRQUFBQSxNQUFNLEVBQUUsSUFGTjtBQUdGQyxRQUFBQSxPQUFPLEVBQUUsSUFIUDtBQUlGQyxRQUFBQSxRQUFRLEVBQUUsSUFKUjtBQUtGQyxRQUFBQSxNQUFNLEVBQUUsSUFMTjtBQU1GQyxRQUFBQSxJQUFJLEVBQUU7QUFOSixPQXBCTztBQTRCWEMsTUFBQUEsRUFBRSxFQUFFO0FBQ0ZDLFFBQUFBLE1BQU0sRUFBRSxJQUROO0FBRUZDLFFBQUFBLEdBQUcsRUFBRTtBQUZILE9BNUJPO0FBZ0NYQyxNQUFBQSxPQUFPLEVBQUU7QUFDUEMsUUFBQUEsRUFBRSxFQUFFO0FBQ0ZDLFVBQUFBLElBQUksRUFBRSxJQUFJQyxvQkFBSixDQUFhLEVBQWIsQ0FESjtBQUVGQyxVQUFBQSxLQUFLLEVBQUUsSUFBSUQsb0JBQUosQ0FBYSxFQUFiO0FBRkwsU0FERztBQUtQRSxRQUFBQSxjQUFjLEVBQUUsQ0FBQztBQUNmQyxVQUFBQSxNQUFNLEVBQUUsSUFETztBQUVmQyxVQUFBQSxJQUFJLEVBQUUsSUFGUztBQUdmQyxVQUFBQSxJQUFJLEVBQUUsSUFIUztBQUlmQyxVQUFBQSxhQUFhLEVBQUUsSUFKQTtBQUtmQyxVQUFBQSxNQUFNLEVBQUU7QUFMTyxTQUFELENBTFQ7QUFZUEMsUUFBQUEsV0FBVyxFQUFFLENBQUMsRUFBRDtBQVpOLE9BaENFO0FBK0NYQyxNQUFBQSxXQUFXLEVBQUUsQ0FBQyxtREFBRCxDQS9DRjtBQWdEWEMsTUFBQUEsT0FBTyxFQUFFO0FBQ1BDLFFBQUFBLE9BQU8sRUFBRSxJQUFJWCxvQkFBSixDQUFhLENBQWIsQ0FERjtBQUVQWSxRQUFBQSxJQUFJLEVBQUUsSUFBSVosb0JBQUosQ0FBYSxDQUFiLENBRkM7QUFHUGEsUUFBQUEsSUFBSSxFQUFFLElBQUliLG9CQUFKLENBQWEsQ0FBYixDQUhDO0FBSVBjLFFBQUFBLFlBQVksRUFBRSxJQUFJZCxvQkFBSixDQUFhLEVBQWIsQ0FKUDtBQUtQZSxRQUFBQSxZQUFZLEVBQUUsSUFBSWYsb0JBQUosQ0FBYSxFQUFiLENBTFA7QUFNUGdCLFFBQUFBLGFBQWEsRUFBRSxJQUFJaEIsb0JBQUosQ0FBYSxFQUFiLENBTlI7QUFPUGlCLFFBQUFBLGFBQWEsRUFBRSxJQUFJakIsb0JBQUosQ0FBYSxFQUFiO0FBUFIsT0FoREU7QUF5RFg7QUFDQWtCLE1BQUFBLFVBQVUsRUFBRSxFQTFERDtBQTJEWEMsTUFBQUEsU0FBUyxFQUFFO0FBQ1RDLFFBQUFBLFVBQVUsRUFBRSxJQURIO0FBRVRDLFFBQUFBLFVBQVUsRUFBRTtBQUZILE9BM0RBO0FBK0RYQyxNQUFBQSxRQUFRLEVBQUU7QUFDUkMsUUFBQUEsT0FBTyxFQUFFLElBREQ7QUFFUkMsUUFBQUEsT0FBTyxFQUFFO0FBRkQ7QUEvREMsS0FBYjtBQW9FQSxTQUFLQyxPQUFMLEdBQWUsSUFBZjtBQUNBLFNBQUtDLFlBQUwsR0FBb0IsSUFBcEI7QUFDRCxHLENBRUQ7QUFDQTs7Ozs7NkJBQ1M7QUFDUCxVQUFJQyxNQUFNLEdBQUdDLElBQUksQ0FBQ0MsS0FBTCxDQUFXRCxJQUFJLENBQUNFLFNBQUwsQ0FBZSxLQUFLNUQsS0FBcEIsQ0FBWCxDQUFiO0FBQ0F5RCxNQUFBQSxNQUFNLENBQUNqQixPQUFQLENBQWVDLE9BQWYsR0FBeUIsS0FBS3pDLEtBQUwsQ0FBV3dDLE9BQVgsQ0FBbUJDLE9BQW5CLENBQTJCb0IsR0FBM0IsRUFBekI7QUFDQUosTUFBQUEsTUFBTSxDQUFDakIsT0FBUCxDQUFlRSxJQUFmLEdBQXNCLEtBQUsxQyxLQUFMLENBQVd3QyxPQUFYLENBQW1CRSxJQUFuQixDQUF3Qm1CLEdBQXhCLEVBQXRCO0FBQ0FKLE1BQUFBLE1BQU0sQ0FBQ2pCLE9BQVAsQ0FBZUcsSUFBZixHQUFzQixLQUFLM0MsS0FBTCxDQUFXd0MsT0FBWCxDQUFtQkcsSUFBbkIsQ0FBd0JrQixHQUF4QixFQUF0QjtBQUNBSixNQUFBQSxNQUFNLENBQUNqQixPQUFQLENBQWVJLFlBQWYsR0FBOEIsS0FBSzVDLEtBQUwsQ0FBV3dDLE9BQVgsQ0FBbUJJLFlBQW5CLENBQWdDaUIsR0FBaEMsRUFBOUI7QUFDQUosTUFBQUEsTUFBTSxDQUFDakIsT0FBUCxDQUFlSyxZQUFmLEdBQThCLEtBQUs3QyxLQUFMLENBQVd3QyxPQUFYLENBQW1CSyxZQUFuQixDQUFnQ2dCLEdBQWhDLEVBQTlCO0FBQ0FKLE1BQUFBLE1BQU0sQ0FBQ2pCLE9BQVAsQ0FBZU8sYUFBZixHQUErQixLQUFLL0MsS0FBTCxDQUFXd0MsT0FBWCxDQUFtQk8sYUFBbkIsQ0FBaUNjLEdBQWpDLEVBQS9CO0FBQ0FKLE1BQUFBLE1BQU0sQ0FBQ2pCLE9BQVAsQ0FBZU0sYUFBZixHQUErQixLQUFLOUMsS0FBTCxDQUFXd0MsT0FBWCxDQUFtQk0sYUFBbkIsQ0FBaUNlLEdBQWpDLEVBQS9CO0FBQ0FKLE1BQUFBLE1BQU0sQ0FBQzlCLE9BQVAsQ0FBZUMsRUFBZixDQUFrQkMsSUFBbEIsR0FBeUIsS0FBSzdCLEtBQUwsQ0FBVzJCLE9BQVgsQ0FBbUJDLEVBQW5CLENBQXNCQyxJQUF0QixDQUEyQmdDLEdBQTNCLEVBQXpCO0FBQ0FKLE1BQUFBLE1BQU0sQ0FBQzlCLE9BQVAsQ0FBZUMsRUFBZixDQUFrQkcsS0FBbEIsR0FBMEIsS0FBSy9CLEtBQUwsQ0FBVzJCLE9BQVgsQ0FBbUJDLEVBQW5CLENBQXNCRyxLQUF0QixDQUE0QjhCLEdBQTVCLEVBQTFCO0FBQ0EsYUFBT0osTUFBUDtBQUNEOzs7MkJBRU07QUFBQTs7QUFDTCxXQUFLSyxPQUFMLEdBQWUseUJBQUtDLFVBQUwsRUFBaUI7QUFDOUJDLFFBQUFBLFFBQVEsRUFBRSxLQURvQjtBQUU5QkMsUUFBQUEsV0FBVyxFQUFFLElBRmlCO0FBRzlCQyxRQUFBQSxLQUFLLEVBQUUsQ0FBQyxTQUFELEVBQVksU0FBWixFQUF1QixTQUF2QixFQUFrQyxLQUFsQztBQUh1QixPQUFqQixDQUFmO0FBTUEsV0FBS0osT0FBTCxDQUFhSyxFQUFiLENBQWdCLE1BQWhCLEVBQXdCLFVBQUNDLElBQUQsRUFBVTtBQUNoQ0MsUUFBQUEsT0FBTyxDQUFDQyxHQUFSLDREQUFnRUYsSUFBaEUsR0FEZ0MsQ0FFaEM7QUFDQTtBQUNELE9BSkQ7QUFNQSxXQUFLTixPQUFMLENBQWFLLEVBQWIsQ0FBZ0IsT0FBaEIsRUFBeUIsVUFBQ0ksQ0FBRCxFQUFPO0FBQzlCRixRQUFBQSxPQUFPLENBQUNDLEdBQVIsb0JBQStCQyxDQUEvQjtBQUNELE9BRkQ7QUFJQSxXQUFLVCxPQUFMLENBQWFLLEVBQWIsQ0FBZ0IsU0FBaEIsRUFBMkIsVUFBQ0ssR0FBRCxFQUFTO0FBQ2xDLFlBQUk7QUFDRkEsVUFBQUEsR0FBRyxHQUFHZCxJQUFJLENBQUNDLEtBQUwsQ0FBV2EsR0FBWCxDQUFOO0FBQ0QsU0FGRCxDQUdBLE9BQU9ELENBQVAsRUFBVSxDQUNUOztBQUNELFlBQUlDLEdBQUcsQ0FBQ0MsR0FBSixJQUFXLE1BQWYsRUFBdUI7QUFDckIsY0FBSSxLQUFJLENBQUNYLE9BQUwsQ0FBYVksU0FBYixJQUEwQixJQUE5QixFQUFvQztBQUNsQyxnQkFBSTtBQUNGLGNBQUEsS0FBSSxDQUFDWixPQUFMLENBQWFhLElBQWIsQ0FBa0IsTUFBbEI7QUFDRCxhQUZELENBRUUsT0FBT0osQ0FBUCxFQUFVO0FBQ1ZGLGNBQUFBLE9BQU8sQ0FBQ08sS0FBUixDQUFjLGlDQUFkO0FBQ0Q7QUFDRjtBQUNGO0FBQ0YsT0FmRDtBQWdCRDs7OzBCQUVLQyxFLEVBQUk7QUFDUixVQUFJLEtBQUtmLE9BQUwsQ0FBYVksU0FBYixJQUEwQixJQUE5QixFQUFvQztBQUNsQyxZQUFJO0FBQ0YsZUFBS1osT0FBTCxDQUFhYSxJQUFiLENBQWtCLE9BQWxCO0FBQ0QsU0FGRCxDQUVFLE9BQU9KLENBQVAsRUFBVTtBQUNWLGlCQUFPTSxFQUFFLENBQUMsSUFBSUMsS0FBSixDQUFVLGVBQVYsQ0FBRCxFQUE2QixJQUE3QixDQUFUO0FBQ0Q7QUFDRixPQU5ELE1BUUUsT0FBT0QsRUFBRSxDQUFDLElBQUlDLEtBQUosQ0FBVSxlQUFWLENBQUQsRUFBNkIsSUFBN0IsQ0FBVDs7QUFFRixVQUFJQyxHQUFHLEdBQUcsU0FBTkEsR0FBTSxDQUFDUCxHQUFELEVBQVM7QUFDakIsWUFBSTtBQUNGQSxVQUFBQSxHQUFHLEdBQUdkLElBQUksQ0FBQ0MsS0FBTCxDQUFXYSxHQUFYLENBQU47QUFDRCxTQUZELENBR0EsT0FBT0QsQ0FBUCxFQUFVLENBQ1Q7O0FBRUQsWUFBSUMsR0FBRyxDQUFDQyxHQUFKLElBQVcsV0FBZixFQUE0QjtBQUMxQk8sVUFBQUEsUUFBUSxDQUFDQyxjQUFULENBQXdCLFNBQXhCLEVBQW1DRixHQUFuQztBQUNBLGlCQUFPRixFQUFFLENBQUMsSUFBRCxFQUFPTCxHQUFHLENBQUNVLElBQVgsQ0FBVDtBQUNEO0FBQ0YsT0FYRDs7QUFhQSxVQUFJRixRQUFRLEdBQUcsS0FBS2xCLE9BQUwsQ0FBYUssRUFBYixDQUFnQixTQUFoQixFQUEyQlksR0FBM0IsQ0FBZjtBQUNEOzs7MkJBRU07QUFDTCxXQUFLeEIsT0FBTCxHQUFlLEtBQWY7QUFDQSxXQUFLTyxPQUFMLENBQWFxQixJQUFiO0FBQ0Q7OztzQ0FFaUI7QUFBQTs7QUFDaEIsV0FBS0Msa0JBQUw7O0FBRUEsVUFBSUMsaUJBQUosRUFBc0JDLGtCQUF0QixFQUF5Q0MsY0FBekMsRUFBd0RDLGtCQUF4RDs7QUFFQSxPQUFDSCxpQkFBZ0IsR0FBRyw0QkFBTTtBQUN4QixRQUFBLE1BQUksQ0FBQ0ksYUFBTCxDQUFtQixZQUFNO0FBQ3ZCQyxVQUFBQSxVQUFVLENBQUNMLGlCQUFnQixDQUFDTSxJQUFqQixDQUFzQixNQUF0QixDQUFELEVBQThCLEdBQTlCLENBQVY7QUFDRCxTQUZEO0FBR0QsT0FKRDs7QUFNQSxPQUFDTCxrQkFBaUIsR0FBRyw2QkFBTTtBQUN6QixRQUFBLE1BQUksQ0FBQ00sZ0JBQUwsQ0FBc0IsWUFBTTtBQUMxQkYsVUFBQUEsVUFBVSxDQUFDSixrQkFBaUIsQ0FBQ0ssSUFBbEIsQ0FBdUIsTUFBdkIsQ0FBRCxFQUErQixJQUEvQixDQUFWO0FBQ0QsU0FGRDtBQUdELE9BSkQsSUFYZ0IsQ0FpQmhCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUVBLE9BQUNKLGNBQWEsR0FBRyx5QkFBTTtBQUNyQixRQUFBLE1BQUksQ0FBQ00sUUFBTCxDQUFjLFlBQU07QUFDbEJILFVBQUFBLFVBQVUsQ0FBQ0gsY0FBYSxDQUFDSSxJQUFkLENBQW1CLE1BQW5CLENBQUQsRUFBMkIsSUFBM0IsQ0FBVjtBQUNELFNBRkQ7QUFHRCxPQUpEOztBQU1BLFdBQUtHLHdCQUFMO0FBQ0EsV0FBS0MsZ0JBQUw7QUFDQSxXQUFLQyxrQkFBTDtBQUVBLFdBQUtDLGNBQUw7QUFDQSxXQUFLQyxhQUFMO0FBRUFDLE1BQUFBLFdBQVcsQ0FBQyxZQUFNO0FBQ2hCLFlBQUlyQyxPQUFPLENBQUNZLFNBQVIsSUFBcUIsS0FBekIsRUFBZ0M7QUFDOUJMLFVBQUFBLE9BQU8sQ0FBQ08sS0FBUixDQUFjLGlDQUFkO0FBQ0FkLFVBQUFBLE9BQU8sQ0FBQ3NDLElBQVI7QUFDRDs7QUFDRCxZQUFJO0FBQ0Z0QyxVQUFBQSxPQUFPLENBQUNhLElBQVIsQ0FBYWpCLElBQUksQ0FBQ0UsU0FBTCxDQUFlO0FBQUVhLFlBQUFBLEdBQUcsRUFBRTtBQUFQLFdBQWYsQ0FBYjtBQUNELFNBRkQsQ0FFRSxPQUFPRixDQUFQLEVBQVU7QUFDVkYsVUFBQUEsT0FBTyxDQUFDTyxLQUFSLENBQWMsc0NBQWQ7QUFDQWQsVUFBQUEsT0FBTyxDQUFDc0MsSUFBUjtBQUNEOztBQUNELFFBQUEsTUFBSSxDQUFDNUMsWUFBTCxHQUFvQmtDLFVBQVUsQ0FBQyxZQUFNO0FBQ25DckIsVUFBQUEsT0FBTyxDQUFDTyxLQUFSLENBQWMsc0NBQWQ7QUFDQWQsVUFBQUEsT0FBTyxDQUFDc0MsSUFBUjtBQUNELFNBSDZCLEVBRzNCLElBSDJCLENBQTlCO0FBSUQsT0FmVSxFQWVSLElBZlEsQ0FBWCxDQXBDZ0IsQ0FxRGhCOztBQUNBdEMsTUFBQUEsT0FBTyxDQUFDSyxFQUFSLENBQVcsU0FBWCxFQUFzQixVQUFDTSxHQUFELEVBQVM7QUFDN0IsWUFBSUEsR0FBRyxJQUFJLE9BQVgsRUFBb0I7QUFDbEIsY0FBSTtBQUNGLGdCQUFJTSxHQUFHLEdBQUdyQixJQUFJLENBQUNFLFNBQUwsQ0FBZTtBQUN2QmEsY0FBQUEsR0FBRyxFQUFFLFdBRGtCO0FBRXZCUyxjQUFBQSxJQUFJLEVBQUUsTUFBSSxDQUFDekIsTUFBTDtBQUZpQixhQUFmLENBQVY7QUFJQUssWUFBQUEsT0FBTyxDQUFDYSxJQUFSLENBQWFJLEdBQWI7QUFDRCxXQU5ELENBTUUsT0FBT1IsQ0FBUCxFQUFVO0FBQ1ZGLFlBQUFBLE9BQU8sQ0FBQ08sS0FBUixDQUFjLHdDQUFkLEVBQXdETCxDQUF4RDtBQUNEO0FBQ0YsU0FWRCxNQVdLLElBQUlFLEdBQUcsSUFBSSxNQUFYLEVBQW1CO0FBQ3RCNEIsVUFBQUEsWUFBWSxDQUFDLE1BQUksQ0FBQzdDLFlBQU4sQ0FBWjtBQUNEO0FBQ0YsT0FmRDtBQWlCRDs7O3lDQUVvQjtBQUFBOztBQUNuQixVQUFJOEMsTUFBTSxHQUFHLFNBQVRBLE1BQVMsR0FBTTtBQUNqQixlQUFPQyw4QkFBUW5HLEdBQVIsR0FDSm9HLElBREksQ0FDQyxVQUFBdEIsSUFBSSxFQUFJO0FBQ1osVUFBQSxNQUFJLENBQUNsRixLQUFMLENBQVdJLEdBQVgsR0FBaUI7QUFDZkUsWUFBQUEsS0FBSyxFQUFFNEUsSUFBSSxDQUFDN0UsWUFERztBQUVmSCxZQUFBQSxLQUFLLEVBQUVnRixJQUFJLENBQUM1RSxLQUZHO0FBR2ZtRyxZQUFBQSxLQUFLLEVBQUV2QixJQUFJLENBQUMzRSxRQUhHO0FBSWZDLFlBQUFBLEtBQUssRUFBRTBFLElBQUksQ0FBQzFFLEtBSkc7QUFLZkMsWUFBQUEsYUFBYSxFQUFFeUUsSUFBSSxDQUFDekU7QUFMTCxXQUFqQjtBQU9ELFNBVEksQ0FBUDtBQVVELE9BWEQ7O0FBYUEsVUFBSWlHLFlBQVksR0FBRyxTQUFmQSxZQUFlLEdBQU07QUFDdkIsZUFBT0gsOEJBQVFJLE1BQVIsR0FDSkgsSUFESSxDQUNDLFVBQUF0QixJQUFJLEVBQUk7QUFDWixVQUFBLE1BQUksQ0FBQ2xGLEtBQUwsQ0FBV0MsU0FBWCxHQUF1QjtBQUNyQkksWUFBQUEsWUFBWSxFQUFFNkUsSUFBSSxDQUFDN0UsWUFERTtBQUVyQkgsWUFBQUEsS0FBSyxFQUFFZ0YsSUFBSSxDQUFDaEYsS0FGUztBQUdyQkMsWUFBQUEsT0FBTyxFQUFFK0UsSUFBSSxDQUFDL0U7QUFITyxXQUF2QjtBQUtELFNBUEksQ0FBUDtBQVFELE9BVEQ7O0FBV0EsVUFBSXlHLFNBQVMsR0FBRyxTQUFaQSxTQUFZLEdBQU07QUFDcEIsZUFBT0wsOEJBQVFNLE1BQVIsR0FDSkwsSUFESSxDQUNDLFVBQUF0QixJQUFJLEVBQUk7QUFDWixVQUFBLE1BQUksQ0FBQ2xGLEtBQUwsQ0FBV2lCLEVBQVgsR0FBZ0I7QUFDZEMsWUFBQUEsUUFBUSxFQUFFZ0UsSUFBSSxDQUFDaEUsUUFERDtBQUVkQyxZQUFBQSxNQUFNLEVBQUUrRCxJQUFJLENBQUMvRCxNQUZDO0FBR2RDLFlBQUFBLE9BQU8sRUFBRThELElBQUksQ0FBQzlELE9BSEE7QUFJZEMsWUFBQUEsUUFBUSxFQUFFNkQsSUFBSSxDQUFDN0QsUUFKRDtBQUtkQyxZQUFBQSxNQUFNLEVBQUU0RCxJQUFJLENBQUM1RCxNQUxDO0FBTWRDLFlBQUFBLElBQUksRUFBRTJELElBQUksQ0FBQzNEO0FBTkcsV0FBaEI7QUFRRCxTQVZJLENBQVA7QUFXRCxPQVpEOztBQWNBLFVBQUl1RixVQUFVLEdBQUcsU0FBYkEsVUFBYSxHQUFNO0FBQ3JCLFFBQUEsTUFBSSxDQUFDOUcsS0FBTCxDQUFXMkIsT0FBWCxDQUFtQkssY0FBbkIsR0FBb0MsRUFBcEM7QUFFQSxlQUFPdUUsOEJBQVFPLFVBQVIsR0FDSk4sSUFESSxDQUNDLFVBQUFPLEtBQUssRUFBSTtBQUNiQSxVQUFBQSxLQUFLLENBQUNDLE9BQU4sQ0FBYyxVQUFDQyxJQUFELEVBQVU7QUFDdEIsWUFBQSxNQUFJLENBQUNqSCxLQUFMLENBQVcyQixPQUFYLENBQW1CSyxjQUFuQixDQUFrQ2tGLElBQWxDLENBQXVDO0FBQ3JDakYsY0FBQUEsTUFBTSxFQUFFZ0YsSUFBSSxDQUFDaEYsTUFEd0I7QUFFckNDLGNBQUFBLElBQUksRUFBRStFLElBQUksQ0FBQy9FLElBRjBCO0FBR3JDQyxjQUFBQSxJQUFJLEVBQUU4RSxJQUFJLENBQUM5RSxJQUgwQjtBQUlyQ0MsY0FBQUEsYUFBYSxFQUFFNkUsSUFBSSxDQUFDN0UsYUFKaUI7QUFLckNDLGNBQUFBLE1BQU0sRUFBRTRFLElBQUksQ0FBQzVFO0FBTHdCLGFBQXZDO0FBT0QsV0FSRDtBQVNELFNBWEksQ0FBUDtBQVlELE9BZkQ7O0FBaUJBcUUsTUFBQUEsWUFBWSxHQUNURixJQURILENBQ1FGLE1BRFIsRUFFR0UsSUFGSCxDQUVRSSxTQUZSLEVBR0dKLElBSEgsQ0FHUU0sVUFIUixXQUlTLFVBQUF2QyxDQUFDLEVBQUk7QUFDVjFFLFFBQUFBLEtBQUssc0RBQXNEMEUsQ0FBdEQsQ0FBTDtBQUNELE9BTkg7QUFPRDs7O29DQUU2QjtBQUFBOztBQUFBLFVBQWhCTSxFQUFnQix1RUFBWCxZQUFNLENBQUcsQ0FBRTs7QUFDNUIwQixvQ0FBUVksZ0JBQVIsQ0FBeUIsSUFBekIsRUFDR1gsSUFESCxDQUNRLFVBQUF4RCxVQUFVLEVBQUk7QUFDbEIsWUFBSW9FLHFCQUFxQixHQUFHcEUsVUFBVSxDQUFDcUUsTUFBWCxDQUFrQixVQUFBQyxTQUFTO0FBQUEsaUJBQUlBLFNBQVMsQ0FBQ0MsS0FBVixJQUFtQixRQUF2QjtBQUFBLFNBQTNCLENBQTVCO0FBQ0EsWUFBSUMsY0FBYyxHQUFHLEVBQXJCOztBQUVBQywwQkFBTVQsT0FBTixDQUFjSSxxQkFBZCxFQUFxQyxVQUFDRSxTQUFELEVBQVlJLElBQVosRUFBcUI7QUFDeERuQix3Q0FBUW9CLG9CQUFSLENBQTZCTCxTQUFTLENBQUNNLEVBQXZDLEVBQ0dwQixJQURILENBQ1EsVUFBQ3FCLEtBQUQsRUFBa0I7QUFDdEIsZ0JBQUlDLElBQUksR0FBR1IsU0FBWDtBQUVBTyxZQUFBQSxLQUFLLENBQUMsQ0FBRCxDQUFMLENBQVNFLFdBQVQsR0FBd0JGLEtBQUssQ0FBQyxDQUFELENBQUwsQ0FBU0UsV0FBVixDQUF1QkMsT0FBdkIsQ0FBK0IsQ0FBL0IsQ0FBdkI7QUFDQUgsWUFBQUEsS0FBSyxDQUFDLENBQUQsQ0FBTCxDQUFTSSxXQUFULEdBQXdCSixLQUFLLENBQUMsQ0FBRCxDQUFMLENBQVNJLFdBQVYsQ0FBdUJELE9BQXZCLENBQStCLENBQS9CLENBQXZCO0FBQ0FILFlBQUFBLEtBQUssQ0FBQyxDQUFELENBQUwsQ0FBU0ssS0FBVCxDQUFlQyxFQUFmLEdBQW9CLENBQUNOLEtBQUssQ0FBQyxDQUFELENBQUwsQ0FBU0ssS0FBVCxDQUFlQyxFQUFmLEdBQW9Cckksa0JBQXJCLEVBQXlDa0ksT0FBekMsQ0FBaUQsQ0FBakQsQ0FBcEI7QUFDQUgsWUFBQUEsS0FBSyxDQUFDLENBQUQsQ0FBTCxDQUFTSyxLQUFULENBQWVFLEVBQWYsR0FBb0IsQ0FBQ1AsS0FBSyxDQUFDLENBQUQsQ0FBTCxDQUFTSyxLQUFULENBQWVFLEVBQWYsR0FBb0J0SSxrQkFBckIsRUFBeUNrSSxPQUF6QyxDQUFpRCxDQUFqRCxDQUFwQjtBQUVBSCxZQUFBQSxLQUFLLENBQUMsQ0FBRCxDQUFMLENBQVNRLE9BQVQsQ0FBaUJDLENBQWpCLEdBQXFCLENBQUNULEtBQUssQ0FBQyxDQUFELENBQUwsQ0FBU1EsT0FBVCxDQUFpQkMsQ0FBakIsR0FBcUJ4SSxrQkFBdEIsRUFBMENrSSxPQUExQyxDQUFrRCxDQUFsRCxDQUFyQjtBQUNBSCxZQUFBQSxLQUFLLENBQUMsQ0FBRCxDQUFMLENBQVNRLE9BQVQsQ0FBaUJFLENBQWpCLEdBQXFCLENBQUNWLEtBQUssQ0FBQyxDQUFELENBQUwsQ0FBU1EsT0FBVCxDQUFpQkUsQ0FBakIsR0FBcUJ6SSxrQkFBdEIsRUFBMENrSSxPQUExQyxDQUFrRCxDQUFsRCxDQUFyQjtBQUVBRixZQUFBQSxJQUFJLENBQUNELEtBQUwsR0FBYVcsS0FBSyxDQUFDQyxPQUFOLENBQWNaLEtBQWQsS0FBd0IsSUFBeEIsR0FBK0JBLEtBQUssQ0FBQyxDQUFELENBQXBDLEdBQTBDLElBQXZEO0FBQ0FMLFlBQUFBLGNBQWMsQ0FBQ04sSUFBZixDQUFvQlksSUFBcEI7QUFDQUosWUFBQUEsSUFBSTtBQUNMLFdBZkgsV0FnQlMsVUFBQW5ELENBQUMsRUFBSTtBQUNWMUUsWUFBQUEsS0FBSyxDQUFDMEUsQ0FBRCxDQUFMO0FBQ0FtRCxZQUFBQSxJQUFJO0FBQ0wsV0FuQkg7QUFvQkQsU0FyQkQsRUFxQkcsVUFBQ2dCLEdBQUQsRUFBUztBQUNWLGNBQUlBLEdBQUosRUFDRTdJLEtBQUssQ0FBQzZJLEdBQUQsQ0FBTDtBQUNGLFVBQUEsTUFBSSxDQUFDMUksS0FBTCxDQUFXZ0QsVUFBWCxHQUF3QndFLGNBQWMsQ0FBQ21CLElBQWYsQ0FBb0IsVUFBQ0MsQ0FBRCxFQUFJQyxDQUFKLEVBQVU7QUFDcEQsZ0JBQUlDLEtBQUssR0FBR0YsQ0FBQyxDQUFDekcsSUFBRixDQUFPNEcsV0FBUCxFQUFaO0FBQ0EsZ0JBQUlDLEtBQUssR0FBR0gsQ0FBQyxDQUFDMUcsSUFBRixDQUFPNEcsV0FBUCxFQUFaO0FBQ0EsbUJBQVFELEtBQUssR0FBR0UsS0FBVCxHQUFrQixDQUFDLENBQW5CLEdBQXdCRixLQUFLLEdBQUdFLEtBQVQsR0FBa0IsQ0FBbEIsR0FBc0IsQ0FBcEQ7QUFDRCxXQUp1QixDQUF4QjtBQUtBLGlCQUFPbkUsRUFBRSxFQUFUO0FBQ0QsU0E5QkQ7QUErQkQsT0FwQ0gsV0FxQ1MsVUFBQU4sQ0FBQyxFQUFJO0FBQ1YxRSxRQUFBQSxLQUFLLENBQUMwRSxDQUFELENBQUw7QUFDQSxlQUFPTSxFQUFFLEVBQVQ7QUFDRCxPQXhDSDtBQXlDRDs7O3NDQUVpQjtBQUFBOztBQUNoQjBCLG9DQUFRbkQsUUFBUixDQUFpQixHQUFqQixFQUNHb0QsSUFESCxDQUNRLFVBQUFwRCxRQUFRLEVBQUk7QUFDaEIsUUFBQSxNQUFJLENBQUNwRCxLQUFMLENBQVdvRCxRQUFYLENBQW9CQyxPQUFwQixHQUE4QkQsUUFBUSxDQUFDaUUsTUFBVCxDQUFnQixVQUFBNEIsT0FBTztBQUFBLGlCQUFJQSxPQUFPLENBQUM1RixPQUFSLEtBQW9CLElBQXhCO0FBQUEsU0FBdkIsQ0FBOUI7QUFDQSxRQUFBLE1BQUksQ0FBQ3JELEtBQUwsQ0FBV29ELFFBQVgsQ0FBb0JFLE9BQXBCLEdBQThCRixRQUFRLENBQUNpRSxNQUFULENBQWdCLFVBQUE0QixPQUFPO0FBQUEsaUJBQUlBLE9BQU8sQ0FBQzVGLE9BQVIsS0FBb0IsS0FBeEI7QUFBQSxTQUF2QixDQUE5QjtBQUNELE9BSkgsV0FLUyxVQUFBa0IsQ0FBQyxFQUFJO0FBQ1YxRSxRQUFBQSxLQUFLLENBQUMwRSxDQUFELENBQUw7QUFDRCxPQVBIO0FBUUQ7OztxQ0FFZ0JNLEUsRUFBSTtBQUFBOztBQUNuQixnQ0FDRzJCLElBREgsQ0FDUSxVQUFBdkQsU0FBUyxFQUFJO0FBQ2pCLFFBQUEsTUFBSSxDQUFDakQsS0FBTCxDQUFXaUQsU0FBWCxDQUFxQkMsVUFBckIsR0FBa0NELFNBQVMsQ0FDeENvRSxNQUQrQixDQUN4QixVQUFDdUIsQ0FBRDtBQUFBLGlCQUFZLEVBQUVBLENBQUMsQ0FBQ25FLEdBQUYsQ0FBTXlFLFFBQU4sQ0FBZSxZQUFmLEtBQWdDTixDQUFDLENBQUNuRSxHQUFGLENBQU15RSxRQUFOLENBQWUsS0FBZixDQUFsQyxDQUFaO0FBQUEsU0FEd0IsRUFFL0JQLElBRitCLENBRTFCLFVBQUNDLENBQUQsRUFBU0MsQ0FBVDtBQUFBLGlCQUFvQkEsQ0FBQyxDQUFDekksR0FBRixHQUFRd0ksQ0FBQyxDQUFDeEksR0FBOUI7QUFBQSxTQUYwQixFQUVTK0ksS0FGVCxDQUVlLENBRmYsRUFFa0IsQ0FGbEIsQ0FBbEM7QUFHQSxRQUFBLE1BQUksQ0FBQ25KLEtBQUwsQ0FBV2lELFNBQVgsQ0FBcUJFLFVBQXJCLEdBQWtDRixTQUFTLENBQ3hDb0UsTUFEK0IsQ0FDeEIsVUFBQ3VCLENBQUQ7QUFBQSxpQkFBWSxFQUFFQSxDQUFDLENBQUNuRSxHQUFGLENBQU15RSxRQUFOLENBQWUsWUFBZixLQUFnQ04sQ0FBQyxDQUFDbkUsR0FBRixDQUFNeUUsUUFBTixDQUFlLEtBQWYsQ0FBbEMsQ0FBWjtBQUFBLFNBRHdCLEVBRS9CUCxJQUYrQixDQUUxQixVQUFDQyxDQUFELEVBQVNDLENBQVQ7QUFBQSxpQkFBb0JBLENBQUMsQ0FBQ08sTUFBRixHQUFXUixDQUFDLENBQUNRLE1BQWpDO0FBQUEsU0FGMEIsRUFFZUQsS0FGZixDQUVxQixDQUZyQixFQUV3QixDQUZ4QixDQUFsQztBQUdBLGVBQU90RSxFQUFFLEVBQVQ7QUFDRCxPQVRILFdBVVMsVUFBQU4sQ0FBQyxFQUFJO0FBQ1YxRSxRQUFBQSxLQUFLLHVDQUF1QzBFLENBQXZDLENBQUw7QUFDQSxlQUFPTSxFQUFFLEVBQVQ7QUFDRCxPQWJIO0FBY0Q7OztxQ0FFZ0I7QUFBQTs7QUFDZixVQUFJd0Usa0JBQUo7O0FBRUEsT0FBQ0Esa0JBQWlCLEdBQUcsNkJBQU07QUFDekI5QyxzQ0FBUStDLGNBQVIsR0FDRzlDLElBREgsQ0FDUSxVQUFBdEIsSUFBSSxFQUFJO0FBQ1osVUFBQSxNQUFJLENBQUNsRixLQUFMLENBQVdJLEdBQVgsQ0FBZU8sV0FBZixHQUE2QnVFLElBQUksQ0FBQ3FFLElBQWxDO0FBQ0E3RCxVQUFBQSxVQUFVLENBQUMyRCxrQkFBaUIsQ0FBQzFELElBQWxCLENBQXVCLE1BQXZCLENBQUQsRUFBK0IsSUFBL0IsQ0FBVjtBQUNELFNBSkgsV0FLUyxVQUFBcEIsQ0FBQyxFQUFJO0FBQ1ZtQixVQUFBQSxVQUFVLENBQUMyRCxrQkFBaUIsQ0FBQzFELElBQWxCLENBQXVCLE1BQXZCLENBQUQsRUFBK0IsSUFBL0IsQ0FBVjtBQUNELFNBUEg7QUFRRCxPQVREOztBQVdBLGVBQVM2RCxLQUFULEdBQWlCO0FBQUE7O0FBQ2YsWUFBTUMsWUFBWSxHQUFHQyxZQUFZLEVBQWpDO0FBRUFoRSxRQUFBQSxVQUFVLENBQUMsVUFBQWlFLENBQUMsRUFBSTtBQUNkLGNBQUlDLFVBQVUsR0FBR0YsWUFBWSxFQUE3QjtBQUVBLGNBQUlHLGNBQWMsR0FBR0QsVUFBVSxDQUFDRSxJQUFYLEdBQWtCTCxZQUFZLENBQUNLLElBQXBEO0FBQ0EsY0FBSUMsZUFBZSxHQUFHSCxVQUFVLENBQUM5SSxLQUFYLEdBQW1CMkksWUFBWSxDQUFDM0ksS0FBdEQ7QUFFQSxjQUFJa0osYUFBYSxHQUFHLENBQUMsUUFBUUMsSUFBSSxDQUFDQyxLQUFMLENBQVcsUUFBUUwsY0FBUixHQUF5QkUsZUFBcEMsQ0FBVCxJQUFpRSxHQUFyRjtBQUNBLFVBQUEsTUFBSSxDQUFDL0osS0FBTCxDQUFXSSxHQUFYLENBQWVRLEtBQWYsR0FBd0JvSixhQUFELENBQWdCaEMsT0FBaEIsQ0FBd0IsQ0FBeEIsQ0FBdkI7QUFDRCxTQVJTLEVBUVAsR0FSTyxDQUFWO0FBU0Q7O0FBRUQsZUFBUzBCLFlBQVQsR0FBd0I7QUFDdEIsWUFBSVMsU0FBUyxHQUFHLENBQWhCO0FBQ0EsWUFBSUMsU0FBUyxHQUFHLENBQWhCOztBQUNBLFlBQU1DLElBQUksR0FBR3BKLGVBQUdvSixJQUFILEVBQWI7O0FBRUEsYUFBSyxJQUFJQyxDQUFDLEdBQUcsQ0FBUixFQUFXQyxHQUFHLEdBQUdGLElBQUksQ0FBQ0csTUFBM0IsRUFBbUNGLENBQUMsR0FBR0MsR0FBdkMsRUFBNENELENBQUMsRUFBN0MsRUFBaUQ7QUFDL0MsY0FBSWxLLEdBQUcsR0FBR2lLLElBQUksQ0FBQ0MsQ0FBRCxDQUFkOztBQUNBLGVBQUssSUFBSXBJLElBQVQsSUFBaUI5QixHQUFHLENBQUNxSyxLQUFyQixFQUE0QjtBQUMxQkwsWUFBQUEsU0FBUyxJQUFJaEssR0FBRyxDQUFDcUssS0FBSixDQUFVdkksSUFBVixDQUFiO0FBQ0Q7O0FBQ0RpSSxVQUFBQSxTQUFTLElBQUkvSixHQUFHLENBQUNxSyxLQUFKLENBQVVYLElBQXZCO0FBQ0Q7O0FBRUQsZUFBTztBQUNMQSxVQUFBQSxJQUFJLEVBQUVZLFFBQVEsQ0FBRVAsU0FBUyxHQUFHRSxJQUFJLENBQUNHLE1BQWxCLEdBQTRCLEVBQTdCLENBRFQ7QUFFTDFKLFVBQUFBLEtBQUssRUFBRTRKLFFBQVEsQ0FBRU4sU0FBUyxHQUFHQyxJQUFJLENBQUNHLE1BQWxCLEdBQTRCLEVBQTdCO0FBRlYsU0FBUDtBQUlEOztBQUVEckUsTUFBQUEsV0FBVyxDQUFDcUQsS0FBSyxDQUFDN0QsSUFBTixDQUFXLElBQVgsQ0FBRCxFQUFtQixJQUFuQixDQUFYO0FBQ0E2RCxNQUFBQSxLQUFLLENBQUM3RCxJQUFOLENBQVcsSUFBWDtBQUNEOzs7NkJBRVFkLEUsRUFBSTtBQUFBOztBQUNYMEIsb0NBQVExRixHQUFSLEdBQ0cyRixJQURILENBQ1EsVUFBQXRCLElBQUksRUFBSTtBQUNaLFFBQUEsTUFBSSxDQUFDbEYsS0FBTCxDQUFXYSxHQUFYLENBQWVDLEtBQWYsR0FBdUIsQ0FBQ29FLElBQUksQ0FBQ3BFLEtBQUwsR0FBYWhCLGtCQUFkLEVBQWtDa0ksT0FBbEMsQ0FBMEMsQ0FBMUMsQ0FBdkI7QUFDQSxRQUFBLE1BQUksQ0FBQ2hJLEtBQUwsQ0FBV2EsR0FBWCxDQUFlRSxJQUFmLEdBQXNCLENBQUNtRSxJQUFJLENBQUNuRSxJQUFMLEdBQVlqQixrQkFBYixFQUFpQ2tJLE9BQWpDLENBQXlDLENBQXpDLENBQXRCO0FBQ0EsUUFBQSxNQUFJLENBQUNoSSxLQUFMLENBQVdhLEdBQVgsQ0FBZUcsTUFBZixHQUF3QixDQUFDa0UsSUFBSSxDQUFDbEUsTUFBTCxHQUFjbEIsa0JBQWYsRUFBbUNrSSxPQUFuQyxDQUEyQyxDQUEzQyxDQUF4QjtBQUNBLFFBQUEsTUFBSSxDQUFDaEksS0FBTCxDQUFXYSxHQUFYLENBQWU4SixTQUFmLEdBQTJCLENBQUN6RixJQUFJLENBQUN5RixTQUFMLEdBQWlCN0ssa0JBQWxCLEVBQXNDa0ksT0FBdEMsQ0FBOEMsQ0FBOUMsQ0FBM0I7QUFDQSxlQUFPbkQsRUFBRSxFQUFUO0FBQ0QsT0FQSCxXQVFTLFVBQUFOLENBQUMsRUFBSTtBQUNWMUUsUUFBQUEsS0FBSyxvQ0FBb0MwRSxDQUFwQyxDQUFMO0FBQ0EsZUFBT00sRUFBRSxFQUFUO0FBQ0QsT0FYSDtBQVlEOzs7K0NBRTBCO0FBQUE7O0FBQ3pCLFVBQUkrRixhQUFKOztBQUVBLE9BQUNBLGFBQVksR0FBRyx3QkFBTTtBQUNwQnJFLHNDQUFRc0Usa0JBQVIsR0FDR3JFLElBREgsQ0FDUSxVQUFBc0UsS0FBSyxFQUFJO0FBQ2IsVUFBQSxPQUFJLENBQUM5SyxLQUFMLENBQVd1QyxXQUFYLEdBQXlCdUksS0FBSyxDQUMzQnpELE1BRHNCLENBQ2YsVUFBQTBELElBQUk7QUFBQSxtQkFBSUEsSUFBSSxDQUFDQyxTQUFMLElBQWtCLEtBQWxCLElBQTJCRCxJQUFJLENBQUNFLFFBQUwsSUFBaUIsS0FBaEQ7QUFBQSxXQURXLEVBRXRCQyxHQUZzQixDQUVsQixVQUFDSCxJQUFEO0FBQUEsNkJBQWtCQSxJQUFJLENBQUNJLFlBQXZCLGNBQXVDSixJQUFJLENBQUNDLFNBQTVDLGNBQXlERCxJQUFJLENBQUNLLFdBQTlELGNBQTZFTCxJQUFJLENBQUNFLFFBQWxGLGNBQThGRixJQUFJLENBQUNNLElBQUwsR0FBWU4sSUFBSSxDQUFDTSxJQUFqQixHQUF3QixTQUF0SDtBQUFBLFdBRmtCLENBQXpCO0FBR0EzRixVQUFBQSxVQUFVLENBQUNrRixhQUFZLENBQUNqRixJQUFiLENBQWtCLE9BQWxCLENBQUQsRUFBMEIsS0FBSyxJQUEvQixDQUFWO0FBQ0QsU0FOSCxXQU9TLFVBQUFwQixDQUFDLEVBQUk7QUFDVjFFLFVBQUFBLEtBQUssNENBQTRDMEUsQ0FBNUMsQ0FBTDtBQUNBbUIsVUFBQUEsVUFBVSxDQUFDa0YsYUFBWSxDQUFDakYsSUFBYixDQUFrQixPQUFsQixDQUFELEVBQTBCLEtBQUssSUFBL0IsQ0FBVjtBQUNELFNBVkg7QUFXRCxPQVpEO0FBYUQ7Ozt1Q0FFa0I7QUFBQTs7QUFDakIsVUFBSXlDLEVBQUUsR0FBRyxDQUFUO0FBQ0EsVUFBSWtELEVBQUUsR0FBRyxDQUFUO0FBQ0EsVUFBSUMsT0FBTyxHQUFHLEtBQWQ7O0FBQ0EsVUFBSUMsaUJBQUosRUFBc0JDLGFBQXRCOztBQUVBLE9BQUNELGlCQUFnQixHQUFHLDRCQUFNO0FBQ3hCakYsc0NBQVFtRixNQUFSLEdBQ0dsRixJQURILENBQ1EsVUFBQW1GLEdBQUcsRUFBSTtBQUNYLGNBQUlDLEdBQUcsR0FBR0QsR0FBRyxDQUFDdEUsTUFBSixDQUFXLFVBQUF3RSxFQUFFO0FBQUEsbUJBQUtBLEVBQUUsQ0FBQ0MsSUFBSCxJQUFXLE9BQU8sSUFBbEIsQ0FBRCxHQUE0QixHQUFoQztBQUFBLFdBQWIsQ0FBVjtBQUNBLFVBQUEsT0FBSSxDQUFDOUwsS0FBTCxDQUFXMkIsT0FBWCxDQUFtQlcsV0FBbkIsR0FBaUNzSixHQUFqQztBQUNBbEcsVUFBQUEsVUFBVSxDQUFDOEYsaUJBQWdCLENBQUM3RixJQUFqQixDQUFzQixPQUF0QixDQUFELEVBQThCLEtBQUssSUFBbkMsQ0FBVjtBQUNELFNBTEgsV0FNUyxVQUFBcEIsQ0FBQyxFQUFJO0FBQ1YxRSxVQUFBQSxLQUFLLDRDQUE0QzBFLENBQTVDLENBQUw7QUFDQW1CLFVBQUFBLFVBQVUsQ0FBQzhGLGlCQUFnQixDQUFDN0YsSUFBakIsQ0FBc0IsT0FBdEIsQ0FBRCxFQUE4QixLQUFLLElBQW5DLENBQVY7QUFDRCxTQVRIO0FBVUQsT0FYRDs7QUFhQSxPQUFDOEYsYUFBWSxHQUFHLHdCQUFNO0FBQ3BCbEYsc0NBQVF3RixPQUFSLEdBQ0d2RixJQURILENBQ1EsVUFBQ3dGLFFBQUQsRUFBbUI7QUFDdkIsY0FBSUMsTUFBTSxHQUFHRCxRQUFRLENBQUM1RCxFQUF0QjtBQUNBLGNBQUk4RCxNQUFNLEdBQUdGLFFBQVEsQ0FBQ1YsRUFBdEI7QUFFQSxjQUFJekosSUFBSSxHQUFHLENBQUMsQ0FBQ29LLE1BQU0sR0FBRzdELEVBQVYsSUFBZ0J0SSxrQkFBakIsRUFBcUNrSSxPQUFyQyxDQUE2QyxDQUE3QyxDQUFYO0FBQ0EsY0FBSWpHLEtBQUssR0FBRyxDQUFDLENBQUNtSyxNQUFNLEdBQUdaLEVBQVYsSUFBZ0J4TCxrQkFBakIsRUFBcUNrSSxPQUFyQyxDQUE2QyxDQUE3QyxDQUFaOztBQUVBLGNBQUl1RCxPQUFPLElBQUksSUFBZixFQUFxQjtBQUNuQixZQUFBLE9BQUksQ0FBQ3ZMLEtBQUwsQ0FBVzJCLE9BQVgsQ0FBbUJDLEVBQW5CLENBQXNCQyxJQUF0QixDQUEyQnNLLEdBQTNCLENBQStCQyxVQUFVLENBQUN2SyxJQUFELENBQXpDOztBQUNBLFlBQUEsT0FBSSxDQUFDN0IsS0FBTCxDQUFXMkIsT0FBWCxDQUFtQkMsRUFBbkIsQ0FBc0JHLEtBQXRCLENBQTRCb0ssR0FBNUIsQ0FBZ0NDLFVBQVUsQ0FBQ3JLLEtBQUQsQ0FBMUM7QUFDRDs7QUFFRHFHLFVBQUFBLEVBQUUsR0FBRzZELE1BQUw7QUFDQVgsVUFBQUEsRUFBRSxHQUFHWSxNQUFMO0FBQ0FYLFVBQUFBLE9BQU8sR0FBRyxJQUFWO0FBQ0E3RixVQUFBQSxVQUFVLENBQUMrRixhQUFZLENBQUM5RixJQUFiLENBQWtCLE9BQWxCLENBQUQsRUFBMEIsSUFBMUIsQ0FBVjtBQUNELFNBakJILFdBa0JTLFVBQUFwQixDQUFDLEVBQUk7QUFDVjFFLFVBQUFBLEtBQUssMkNBQTJDMEUsQ0FBM0MsQ0FBTDtBQUNBbUIsVUFBQUEsVUFBVSxDQUFDK0YsYUFBWSxDQUFDOUYsSUFBYixDQUFrQixPQUFsQixDQUFELEVBQTBCLElBQTFCLENBQVY7QUFDRCxTQXJCSDtBQXNCRCxPQXZCRDtBQXdCRDs7O29DQUVlO0FBQUE7O0FBQ2QsVUFBSTBHLFdBQVcsR0FBRyxTQUFkQSxXQUFjLEdBQU07QUFDdEJSLHVCQUFHUyxRQUFILENBQVksc0JBQVosRUFBb0MsVUFBQzVELEdBQUQsRUFBTTZELEdBQU4sRUFBYztBQUNoRCxjQUFJN0QsR0FBSixFQUFTO0FBQ1QsY0FBTThELE1BQU0sR0FBR0QsR0FBRyxDQUFDRSxRQUFKLEdBQWVDLElBQWYsRUFBZjtBQUNBLGNBQU1DLE1BQU0sR0FBR0gsTUFBTSxDQUFDSSxLQUFQLENBQWEsSUFBYixDQUFmO0FBQ0EsY0FBSUQsTUFBTSxDQUFDbkMsTUFBUCxLQUFrQixDQUF0QixFQUF5QjtBQUN6QixVQUFBLE9BQUksQ0FBQ3hLLEtBQUwsQ0FBV3dCLEVBQVgsQ0FBY0MsTUFBZCxHQUF1QmlKLFFBQVEsQ0FBQ2lDLE1BQU0sQ0FBQyxDQUFELENBQVAsQ0FBL0I7QUFDQSxVQUFBLE9BQUksQ0FBQzNNLEtBQUwsQ0FBV3dCLEVBQVgsQ0FBY0UsR0FBZCxHQUFvQmdKLFFBQVEsQ0FBQ2lDLE1BQU0sQ0FBQyxDQUFELENBQVAsQ0FBNUI7QUFDRCxTQVBEO0FBUUQsT0FURDs7QUFXQXhHLE1BQUFBLFdBQVcsQ0FBQyxZQUFNO0FBQ2hCa0csUUFBQUEsV0FBVztBQUNaLE9BRlUsRUFFUixLQUFLLElBRkcsQ0FBWDtBQUlBQSxNQUFBQSxXQUFXO0FBQ1o7Ozt5Q0FFb0I7QUFBQTs7QUFDbkIsVUFBSVEsaUJBQUosRUFBdUJDLHVCQUF2QixDQURtQixDQUduQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUFFQXZHLG9DQUFRd0csdUJBQVIsQ0FBZ0MsVUFBQ0MsYUFBRCxFQUFtQjtBQUNqRCxZQUFJekIsT0FBTyxHQUFHLEtBQWQ7QUFDQSxZQUFJbkQsRUFBRSxHQUFHLENBQVQ7QUFDQSxZQUFJRCxFQUFFLEdBQUcsQ0FBVDtBQUNBLFlBQUk4RSxJQUFJLEdBQUcsQ0FBWDtBQUNBLFlBQUlDLElBQUksR0FBRyxDQUFYO0FBQ0EsWUFBSUMsSUFBSSxHQUFHLENBQVg7QUFDQSxZQUFJQyxJQUFJLEdBQUcsQ0FBWDs7QUFFQSxTQUFDTix1QkFBc0IsR0FBRyxrQ0FBTTtBQUM5QnZHLHdDQUFROEcsWUFBUixDQUFxQkwsYUFBckIsRUFDR3hHLElBREgsQ0FDUSxVQUFDOEcsR0FBRCxFQUFTO0FBQ2IsZ0JBQUlyQixNQUFNLEdBQUcsQ0FBQ3FCLEdBQUcsQ0FBQyxDQUFELENBQUgsQ0FBT0MsUUFBUCxHQUFrQm5GLEVBQW5CLElBQXlCdEksa0JBQXRDO0FBQ0EsZ0JBQUkwTixNQUFNLEdBQUcsQ0FBQ0YsR0FBRyxDQUFDLENBQUQsQ0FBSCxDQUFPRyxRQUFQLEdBQWtCdEYsRUFBbkIsSUFBeUJySSxrQkFBdEM7QUFDQXNJLFlBQUFBLEVBQUUsR0FBR2tGLEdBQUcsQ0FBQyxDQUFELENBQUgsQ0FBT0MsUUFBWjtBQUNBcEYsWUFBQUEsRUFBRSxHQUFHbUYsR0FBRyxDQUFDLENBQUQsQ0FBSCxDQUFPRyxRQUFaO0FBRUEsZ0JBQUlDLFFBQVEsR0FBRyxDQUFDSixHQUFHLENBQUMsQ0FBRCxDQUFILENBQU9LLFNBQVAsR0FBbUJWLElBQXBCLElBQTRCbk4sa0JBQTNDO0FBQ0EsZ0JBQUk4TixRQUFRLEdBQUcsQ0FBQ04sR0FBRyxDQUFDLENBQUQsQ0FBSCxDQUFPTyxTQUFQLEdBQW1CWCxJQUFwQixJQUE0QnBOLGtCQUEzQztBQUNBbU4sWUFBQUEsSUFBSSxHQUFHSyxHQUFHLENBQUMsQ0FBRCxDQUFILENBQU9LLFNBQWQ7QUFDQVQsWUFBQUEsSUFBSSxHQUFHSSxHQUFHLENBQUMsQ0FBRCxDQUFILENBQU9PLFNBQWQ7QUFFQSxnQkFBSUMsUUFBUSxHQUFHLENBQUNSLEdBQUcsQ0FBQyxDQUFELENBQUgsQ0FBT1MsVUFBUCxHQUFvQlosSUFBckIsSUFBNkJyTixrQkFBNUM7QUFDQSxnQkFBSWtPLFFBQVEsR0FBRyxDQUFDVixHQUFHLENBQUMsQ0FBRCxDQUFILENBQU9XLFVBQVAsR0FBb0JiLElBQXJCLElBQTZCdE4sa0JBQTVDO0FBQ0FxTixZQUFBQSxJQUFJLEdBQUdHLEdBQUcsQ0FBQyxDQUFELENBQUgsQ0FBT1MsVUFBZDtBQUNBWCxZQUFBQSxJQUFJLEdBQUdFLEdBQUcsQ0FBQyxDQUFELENBQUgsQ0FBT1csVUFBZDs7QUFFQSxnQkFBSTFDLE9BQU8sSUFBSSxJQUFmLEVBQXFCO0FBQ25CLGNBQUEsT0FBSSxDQUFDdkwsS0FBTCxDQUFXd0MsT0FBWCxDQUFtQkcsSUFBbkIsQ0FBd0J3SixHQUF4QixDQUE0QkYsTUFBNUI7O0FBQ0EsY0FBQSxPQUFJLENBQUNqTSxLQUFMLENBQVd3QyxPQUFYLENBQW1CRSxJQUFuQixDQUF3QnlKLEdBQXhCLENBQTRCcUIsTUFBNUI7O0FBQ0EsY0FBQSxPQUFJLENBQUN4TixLQUFMLENBQVd3QyxPQUFYLENBQW1CSSxZQUFuQixDQUFnQ3VKLEdBQWhDLENBQW9DdUIsUUFBcEM7O0FBQ0EsY0FBQSxPQUFJLENBQUMxTixLQUFMLENBQVd3QyxPQUFYLENBQW1CSyxZQUFuQixDQUFnQ3NKLEdBQWhDLENBQW9DeUIsUUFBcEM7O0FBQ0EsY0FBQSxPQUFJLENBQUM1TixLQUFMLENBQVd3QyxPQUFYLENBQW1CTyxhQUFuQixDQUFpQ29KLEdBQWpDLENBQXFDMkIsUUFBckM7O0FBQ0EsY0FBQSxPQUFJLENBQUM5TixLQUFMLENBQVd3QyxPQUFYLENBQW1CTSxhQUFuQixDQUFpQ3FKLEdBQWpDLENBQXFDNkIsUUFBckM7QUFDRDs7QUFDRHpDLFlBQUFBLE9BQU8sR0FBRyxJQUFWO0FBQ0E3RixZQUFBQSxVQUFVLENBQUNvSCx1QkFBc0IsQ0FBQ25ILElBQXZCLENBQTRCLE9BQTVCLENBQUQsRUFBb0MsSUFBcEMsQ0FBVjtBQUNELFdBM0JILFdBNEJTLFVBQUFwQixDQUFDLEVBQUk7QUFDVjFFLFlBQUFBLEtBQUssc0NBQXNDMEUsQ0FBdEMsQ0FBTDtBQUNBbUIsWUFBQUEsVUFBVSxDQUFDb0gsdUJBQXNCLENBQUNuSCxJQUF2QixDQUE0QixPQUE1QixDQUFELEVBQW9DLEdBQXBDLENBQVY7QUFDRCxXQS9CSDtBQWdDRCxTQWpDRDtBQWtDRCxPQTNDRDtBQTZDRDs7Ozs7QUFHSCxJQUFJdUksT0FBTyxDQUFDM0UsSUFBUixLQUFpQjRFLE1BQXJCLEVBQTZCO0FBQzNCLE1BQUlDLEdBQUcsR0FBRyxJQUFJck8sVUFBSixFQUFWO0FBQ0FxTyxFQUFBQSxHQUFHLENBQUNDLGVBQUo7QUFDRDs7ZUFFY3RPLFUiLCJzb3VyY2VzQ29udGVudCI6WyJcbmltcG9ydCBzeXNpbmZvIGZyb20gJ3N5c3RlbWluZm9ybWF0aW9uJ1xuaW1wb3J0IHBzTGlzdCBmcm9tICcuL3BzTGlzdCdcbmltcG9ydCBhc3luYyBmcm9tICdhc3luYydcbmltcG9ydCBNZWFuQ2FsYyBmcm9tICcuL01lYW5DYWxjJ1xuaW1wb3J0IHsgZm9yayB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnXG5pbXBvcnQgb3MgZnJvbSAnb3MnXG5pbXBvcnQgZnMgZnJvbSAnZnMnXG5pbXBvcnQgZGVidWdMb2dnZXIgZnJvbSAnZGVidWcnXG5cbmNvbnN0IGRlYnVnID0gZGVidWdMb2dnZXIoJ3BtMjpzeXNpbmZvcycpO1xuXG5jb25zdCBERUZBVUxUX0NPTlZFUlNJT04gPSAxMDI0ICogMTAyNFxuXG5jbGFzcyBTeXN0ZW1JbmZvIHtcbiAgaW5mb3M6IGFueTtcbiAgcGluZ190aW1lb3V0OiBOb2RlSlMuVGltZW91dDtcbiAgcmVzdGFydDogYm9vbGVhbjtcbiAgcHJvY2VzczogYW55O1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuaW5mb3MgPSB7XG4gICAgICBiYXNlYm9hcmQ6IHtcbiAgICAgICAgbW9kZWw6IG51bGwsXG4gICAgICAgIHZlcnNpb246IG51bGxcbiAgICAgIH0sXG4gICAgICBjcHU6IHtcbiAgICAgICAgbWFudWZhY3R1cmVyOiBudWxsLFxuICAgICAgICBicmFuZDogbnVsbCxcbiAgICAgICAgc3BlZWRtYXg6IG51bGwsXG4gICAgICAgIGNvcmVzOiBudWxsLFxuICAgICAgICBwaHlzaWNhbENvcmVzOiBudWxsLFxuICAgICAgICBwcm9jZXNzb3JzOiBudWxsLFxuICAgICAgICB0ZW1wZXJhdHVyZTogbnVsbCxcbiAgICAgICAgdXNhZ2U6IG51bGxcbiAgICAgIH0sXG4gICAgICBtZW06IHtcbiAgICAgICAgdG90YWw6IG51bGwsXG4gICAgICAgIGZyZWU6IG51bGwsXG4gICAgICAgIGFjdGl2ZTogbnVsbFxuICAgICAgfSxcbiAgICAgIG9zOiB7XG4gICAgICAgIHBsYXRmb3JtOiBudWxsLFxuICAgICAgICBkaXN0cm86IG51bGwsXG4gICAgICAgIHJlbGVhc2U6IG51bGwsXG4gICAgICAgIGNvZGVuYW1lOiBudWxsLFxuICAgICAgICBrZXJuZWw6IG51bGwsXG4gICAgICAgIGFyY2g6IG51bGwsXG4gICAgICB9LFxuICAgICAgZmQ6IHtcbiAgICAgICAgb3BlbmVkOiBudWxsLFxuICAgICAgICBtYXg6IG51bGxcbiAgICAgIH0sXG4gICAgICBzdG9yYWdlOiB7XG4gICAgICAgIGlvOiB7XG4gICAgICAgICAgcmVhZDogbmV3IE1lYW5DYWxjKDE1KSxcbiAgICAgICAgICB3cml0ZTogbmV3IE1lYW5DYWxjKDE1KVxuICAgICAgICB9LFxuICAgICAgICBwaHlzaWNhbF9kaXNrczogW3tcbiAgICAgICAgICBkZXZpY2U6IG51bGwsXG4gICAgICAgICAgdHlwZTogbnVsbCxcbiAgICAgICAgICBuYW1lOiBudWxsLFxuICAgICAgICAgIGludGVyZmFjZVR5cGU6IG51bGwsXG4gICAgICAgICAgdmVuZG9yOiBudWxsXG4gICAgICAgIH1dLFxuICAgICAgICBmaWxlc3lzdGVtczogW3tcbiAgICAgICAgfV1cbiAgICAgIH0sXG4gICAgICBjb25uZWN0aW9uczogWydzb3VyY2VfaXA6c291cmNlX3BvcnQtZGVzdF9pcDpkZXN0X3BvcnQtcHJvY19uYW1lJ10sXG4gICAgICBuZXR3b3JrOiB7XG4gICAgICAgIGxhdGVuY3k6IG5ldyBNZWFuQ2FsYyg1KSxcbiAgICAgICAgdHhfNTogbmV3IE1lYW5DYWxjKDUpLFxuICAgICAgICByeF81OiBuZXcgTWVhbkNhbGMoNSksXG4gICAgICAgIHJ4X2Vycm9yc182MDogbmV3IE1lYW5DYWxjKDYwKSxcbiAgICAgICAgdHhfZXJyb3JzXzYwOiBuZXcgTWVhbkNhbGMoNjApLFxuICAgICAgICB0eF9kcm9wcGVkXzYwOiBuZXcgTWVhbkNhbGMoNjApLFxuICAgICAgICByeF9kcm9wcGVkXzYwOiBuZXcgTWVhbkNhbGMoNjApXG4gICAgICB9LFxuICAgICAgLy8gUHJvY3NcbiAgICAgIGNvbnRhaW5lcnM6IFtdLFxuICAgICAgcHJvY2Vzc2VzOiB7XG4gICAgICAgIGNwdV9zb3J0ZWQ6IG51bGwsXG4gICAgICAgIG1lbV9zb3J0ZWQ6IG51bGxcbiAgICAgIH0sXG4gICAgICBzZXJ2aWNlczoge1xuICAgICAgICBydW5uaW5nOiBudWxsLFxuICAgICAgICBzdG9wcGVkOiBudWxsXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMucmVzdGFydCA9IHRydWVcbiAgICB0aGlzLnBpbmdfdGltZW91dCA9IG51bGxcbiAgfVxuXG4gIC8vIENhc3QgTWVhbkNhbGMgYW5kIG90aGVyIG9iamVjdCB0byByZWFsIHZhbHVlXG4gIC8vIFRoaXMgbWV0aG9kIHJldHJpZXZlIHRoZSBtYWNoaW5lIHNuYXBzaG90IHdlbGwgZm9ybWF0ZWRcbiAgcmVwb3J0KCkge1xuICAgIHZhciByZXBvcnQgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHRoaXMuaW5mb3MpKVxuICAgIHJlcG9ydC5uZXR3b3JrLmxhdGVuY3kgPSB0aGlzLmluZm9zLm5ldHdvcmsubGF0ZW5jeS52YWwoKVxuICAgIHJlcG9ydC5uZXR3b3JrLnR4XzUgPSB0aGlzLmluZm9zLm5ldHdvcmsudHhfNS52YWwoKVxuICAgIHJlcG9ydC5uZXR3b3JrLnJ4XzUgPSB0aGlzLmluZm9zLm5ldHdvcmsucnhfNS52YWwoKVxuICAgIHJlcG9ydC5uZXR3b3JrLnJ4X2Vycm9yc182MCA9IHRoaXMuaW5mb3MubmV0d29yay5yeF9lcnJvcnNfNjAudmFsKClcbiAgICByZXBvcnQubmV0d29yay50eF9lcnJvcnNfNjAgPSB0aGlzLmluZm9zLm5ldHdvcmsudHhfZXJyb3JzXzYwLnZhbCgpXG4gICAgcmVwb3J0Lm5ldHdvcmsucnhfZHJvcHBlZF82MCA9IHRoaXMuaW5mb3MubmV0d29yay5yeF9kcm9wcGVkXzYwLnZhbCgpXG4gICAgcmVwb3J0Lm5ldHdvcmsudHhfZHJvcHBlZF82MCA9IHRoaXMuaW5mb3MubmV0d29yay50eF9kcm9wcGVkXzYwLnZhbCgpXG4gICAgcmVwb3J0LnN0b3JhZ2UuaW8ucmVhZCA9IHRoaXMuaW5mb3Muc3RvcmFnZS5pby5yZWFkLnZhbCgpXG4gICAgcmVwb3J0LnN0b3JhZ2UuaW8ud3JpdGUgPSB0aGlzLmluZm9zLnN0b3JhZ2UuaW8ud3JpdGUudmFsKClcbiAgICByZXR1cm4gcmVwb3J0XG4gIH1cblxuICBmb3JrKCkge1xuICAgIHRoaXMucHJvY2VzcyA9IGZvcmsoX19maWxlbmFtZSwge1xuICAgICAgZGV0YWNoZWQ6IGZhbHNlLFxuICAgICAgd2luZG93c0hpZGU6IHRydWUsXG4gICAgICBzdGRpbzogWydpbmhlcml0JywgJ2luaGVyaXQnLCAnaW5oZXJpdCcsICdpcGMnXVxuICAgIH0gYXMgYW55KVxuXG4gICAgdGhpcy5wcm9jZXNzLm9uKCdleGl0JywgKGNvZGUpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGBzeXN0ZW1pbmZvcyBjb2xsZWN0aW9uIHByb2Nlc3Mgb2ZmbGluZSB3aXRoIGNvZGUgJHtjb2RlfWApXG4gICAgICAvLyBpZiAodGhpcy5yZXN0YXJ0ID09IHRydWUpXG4gICAgICAvLyAgIHRoaXMuZm9yaygpXG4gICAgfSlcblxuICAgIHRoaXMucHJvY2Vzcy5vbignZXJyb3InLCAoZSkgPT4ge1xuICAgICAgY29uc29sZS5sb2coYFN5c2luZm8gZXJyb3JlZGAsIGUpXG4gICAgfSlcblxuICAgIHRoaXMucHJvY2Vzcy5vbignbWVzc2FnZScsIChtc2cpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIG1zZyA9IEpTT04ucGFyc2UobXNnKVxuICAgICAgfVxuICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgIH1cbiAgICAgIGlmIChtc2cuY21kID09ICdwaW5nJykge1xuICAgICAgICBpZiAodGhpcy5wcm9jZXNzLmNvbm5lY3RlZCA9PSB0cnVlKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRoaXMucHJvY2Vzcy5zZW5kKCdwb25nJylcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdDYW5ub3Qgc2VuZCBtZXNzYWdlIHRvIFN5c2luZm9zJylcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgcXVlcnkoY2IpIHtcbiAgICBpZiAodGhpcy5wcm9jZXNzLmNvbm5lY3RlZCA9PSB0cnVlKSB7XG4gICAgICB0cnkge1xuICAgICAgICB0aGlzLnByb2Nlc3Muc2VuZCgncXVlcnknKVxuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZXR1cm4gY2IobmV3IEVycm9yKCdub3QgcmVhZHkgeWV0JyksIG51bGwpXG4gICAgICB9XG4gICAgfVxuICAgIGVsc2VcbiAgICAgIHJldHVybiBjYihuZXcgRXJyb3IoJ25vdCByZWFkeSB5ZXQnKSwgbnVsbClcblxuICAgIHZhciByZXMgPSAobXNnKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBtc2cgPSBKU09OLnBhcnNlKG1zZylcbiAgICAgIH1cbiAgICAgIGNhdGNoIChlKSB7XG4gICAgICB9XG5cbiAgICAgIGlmIChtc2cuY21kID09ICdxdWVyeTpyZXMnKSB7XG4gICAgICAgIGxpc3RlbmVyLnJlbW92ZUxpc3RlbmVyKCdtZXNzYWdlJywgcmVzKVxuICAgICAgICByZXR1cm4gY2IobnVsbCwgbXNnLmRhdGEpXG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGxpc3RlbmVyID0gdGhpcy5wcm9jZXNzLm9uKCdtZXNzYWdlJywgcmVzKVxuICB9XG5cbiAga2lsbCgpIHtcbiAgICB0aGlzLnJlc3RhcnQgPSBmYWxzZVxuICAgIHRoaXMucHJvY2Vzcy5raWxsKClcbiAgfVxuXG4gIHN0YXJ0Q29sbGVjdGlvbigpIHtcbiAgICB0aGlzLnN0YXRpY0luZm9ybWF0aW9ucygpXG5cbiAgICB2YXIgZG9ja2VyQ29sbGVjdGlvbiwgcHJvY2Vzc0NvbGxlY3Rpb24sIG1lbUNvbGxlY3Rpb24sIHNlcnZpY2VzQ29sbGVjdGlvblxuXG4gICAgKGRvY2tlckNvbGxlY3Rpb24gPSAoKSA9PiB7XG4gICAgICB0aGlzLmRvY2tlclN1bW1hcnkoKCkgPT4ge1xuICAgICAgICBzZXRUaW1lb3V0KGRvY2tlckNvbGxlY3Rpb24uYmluZCh0aGlzKSwgMzAwKVxuICAgICAgfSlcbiAgICB9KSgpO1xuXG4gICAgKHByb2Nlc3NDb2xsZWN0aW9uID0gKCkgPT4ge1xuICAgICAgdGhpcy5wcm9jZXNzZXNTdW1tYXJ5KCgpID0+IHtcbiAgICAgICAgc2V0VGltZW91dChwcm9jZXNzQ29sbGVjdGlvbi5iaW5kKHRoaXMpLCA1MDAwKVxuICAgICAgfSlcbiAgICB9KSgpO1xuXG4gICAgLy8gKHNlcnZpY2VzQ29sbGVjdGlvbiA9ICgpID0+IHtcbiAgICAvLyAgIHRoaXMuc2VydmljZXNTdW1tYXJ5KCgpID0+IHtcbiAgICAvLyAgICAgc2V0VGltZW91dChzZXJ2aWNlc0NvbGxlY3Rpb24uYmluZCh0aGlzKSwgNjAwMDApXG4gICAgLy8gICB9KVxuICAgIC8vIH0pKCk7XG5cbiAgICAobWVtQ29sbGVjdGlvbiA9ICgpID0+IHtcbiAgICAgIHRoaXMubWVtU3RhdHMoKCkgPT4ge1xuICAgICAgICBzZXRUaW1lb3V0KG1lbUNvbGxlY3Rpb24uYmluZCh0aGlzKSwgMTAwMClcbiAgICAgIH0pXG4gICAgfSkoKTtcblxuICAgIHRoaXMubmV0d29ya0Nvbm5lY3Rpb25zV29ya2VyKClcbiAgICB0aGlzLmRpc2tzU3RhdHNXb3JrZXIoKVxuICAgIHRoaXMubmV0d29ya1N0YXRzV29ya2VyKClcblxuICAgIHRoaXMuY3B1U3RhdHNXb3JrZXIoKVxuICAgIHRoaXMuZmRTdGF0c1dvcmtlcigpXG5cbiAgICBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICBpZiAocHJvY2Vzcy5jb25uZWN0ZWQgPT0gZmFsc2UpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignU3lzaW5mb3Mgbm90IGNvbm5lY3RlZCwgZXhpdGluZycpXG4gICAgICAgIHByb2Nlc3MuZXhpdCgpXG4gICAgICB9XG4gICAgICB0cnkge1xuICAgICAgICBwcm9jZXNzLnNlbmQoSlNPTi5zdHJpbmdpZnkoeyBjbWQ6ICdwaW5nJyB9KSlcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignUE0yIGlzIGRlYWQgd2hpbGUgZG9pbmcgcHJvY2Vzcy5zZW5kJylcbiAgICAgICAgcHJvY2Vzcy5leGl0KClcbiAgICAgIH1cbiAgICAgIHRoaXMucGluZ190aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1BNMiBpcyBkZWFkIHdoaWxlIHdhaXRpbmcgZm9yIGEgcG9uZycpXG4gICAgICAgIHByb2Nlc3MuZXhpdCgpXG4gICAgICB9LCAyMDAwKVxuICAgIH0sIDMwMDApXG5cbiAgICAvLyBTeXN0ZW1pbmZvIHJlY2VpdmUgY29tbWFuZFxuICAgIHByb2Nlc3Mub24oJ21lc3NhZ2UnLCAoY21kKSA9PiB7XG4gICAgICBpZiAoY21kID09ICdxdWVyeScpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICB2YXIgcmVzID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgY21kOiAncXVlcnk6cmVzJyxcbiAgICAgICAgICAgIGRhdGE6IHRoaXMucmVwb3J0KClcbiAgICAgICAgICB9KVxuICAgICAgICAgIHByb2Nlc3Muc2VuZChyZXMpXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdDb3VsZCBub3QgcmV0cmlldmUgc3lzdGVtIGluZm9ybWF0aW9ucycsIGUpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGNtZCA9PSAncG9uZycpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMucGluZ190aW1lb3V0KVxuICAgICAgfVxuICAgIH0pXG5cbiAgfVxuXG4gIHN0YXRpY0luZm9ybWF0aW9ucygpIHtcbiAgICB2YXIgZ2V0Q1BVID0gKCkgPT4ge1xuICAgICAgcmV0dXJuIHN5c2luZm8uY3B1KClcbiAgICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgICAgdGhpcy5pbmZvcy5jcHUgPSB7XG4gICAgICAgICAgICBicmFuZDogZGF0YS5tYW51ZmFjdHVyZXIsXG4gICAgICAgICAgICBtb2RlbDogZGF0YS5icmFuZCxcbiAgICAgICAgICAgIHNwZWVkOiBkYXRhLnNwZWVkbWF4LFxuICAgICAgICAgICAgY29yZXM6IGRhdGEuY29yZXMsXG4gICAgICAgICAgICBwaHlzaWNhbENvcmVzOiBkYXRhLnBoeXNpY2FsQ29yZXNcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgdmFyIGdldEJhc2Vib2FyZCA9ICgpID0+IHtcbiAgICAgIHJldHVybiBzeXNpbmZvLnN5c3RlbSgpXG4gICAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICAgIHRoaXMuaW5mb3MuYmFzZWJvYXJkID0ge1xuICAgICAgICAgICAgbWFudWZhY3R1cmVyOiBkYXRhLm1hbnVmYWN0dXJlcixcbiAgICAgICAgICAgIG1vZGVsOiBkYXRhLm1vZGVsLFxuICAgICAgICAgICAgdmVyc2lvbjogZGF0YS52ZXJzaW9uXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIHZhciBnZXRPc0luZm8gPSAoKSA9PiB7XG4gICAgICByZXR1cm4gc3lzaW5mby5vc0luZm8oKVxuICAgICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgICB0aGlzLmluZm9zLm9zID0ge1xuICAgICAgICAgICAgcGxhdGZvcm06IGRhdGEucGxhdGZvcm0sXG4gICAgICAgICAgICBkaXN0cm86IGRhdGEuZGlzdHJvLFxuICAgICAgICAgICAgcmVsZWFzZTogZGF0YS5yZWxlYXNlLFxuICAgICAgICAgICAgY29kZW5hbWU6IGRhdGEuY29kZW5hbWUsXG4gICAgICAgICAgICBrZXJuZWw6IGRhdGEua2VybmVsLFxuICAgICAgICAgICAgYXJjaDogZGF0YS5hcmNoXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIHZhciBkaXNrTGF5b3V0ID0gKCkgPT4ge1xuICAgICAgdGhpcy5pbmZvcy5zdG9yYWdlLnBoeXNpY2FsX2Rpc2tzID0gW11cblxuICAgICAgcmV0dXJuIHN5c2luZm8uZGlza0xheW91dCgpXG4gICAgICAgIC50aGVuKGRpc2tzID0+IHtcbiAgICAgICAgICBkaXNrcy5mb3JFYWNoKChkaXNrKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmluZm9zLnN0b3JhZ2UucGh5c2ljYWxfZGlza3MucHVzaCh7XG4gICAgICAgICAgICAgIGRldmljZTogZGlzay5kZXZpY2UsXG4gICAgICAgICAgICAgIHR5cGU6IGRpc2sudHlwZSxcbiAgICAgICAgICAgICAgbmFtZTogZGlzay5uYW1lLFxuICAgICAgICAgICAgICBpbnRlcmZhY2VUeXBlOiBkaXNrLmludGVyZmFjZVR5cGUsXG4gICAgICAgICAgICAgIHZlbmRvcjogZGlzay52ZW5kb3JcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBnZXRCYXNlYm9hcmQoKVxuICAgICAgLnRoZW4oZ2V0Q1BVKVxuICAgICAgLnRoZW4oZ2V0T3NJbmZvKVxuICAgICAgLnRoZW4oZGlza0xheW91dClcbiAgICAgIC5jYXRjaChlID0+IHtcbiAgICAgICAgZGVidWcoYEVycm9yIHdoZW4gdHJ5aW5nIHRvIHJldHJpZXZlIHN0YXRpYyBpbmZvcm1hdGlvbnNgLCBlKVxuICAgICAgfSlcbiAgfVxuXG4gIGRvY2tlclN1bW1hcnkoY2IgPSAoKSA9PiB7IH0pIHtcbiAgICBzeXNpbmZvLmRvY2tlckNvbnRhaW5lcnModHJ1ZSlcbiAgICAgIC50aGVuKGNvbnRhaW5lcnMgPT4ge1xuICAgICAgICB2YXIgbm9uX2V4aXRlZF9jb250YWluZXJzID0gY29udGFpbmVycy5maWx0ZXIoY29udGFpbmVyID0+IGNvbnRhaW5lci5zdGF0ZSAhPSAnZXhpdGVkJylcbiAgICAgICAgdmFyIG5ld19jb250YWluZXJzID0gW11cblxuICAgICAgICBhc3luYy5mb3JFYWNoKG5vbl9leGl0ZWRfY29udGFpbmVycywgKGNvbnRhaW5lciwgbmV4dCkgPT4ge1xuICAgICAgICAgIHN5c2luZm8uZG9ja2VyQ29udGFpbmVyU3RhdHMoY29udGFpbmVyLmlkKVxuICAgICAgICAgICAgLnRoZW4oKHN0YXRzOiBhbnlbXSkgPT4ge1xuICAgICAgICAgICAgICB2YXIgbWV0YSA9IGNvbnRhaW5lclxuXG4gICAgICAgICAgICAgIHN0YXRzWzBdLmNwdV9wZXJjZW50ID0gKHN0YXRzWzBdLmNwdV9wZXJjZW50KS50b0ZpeGVkKDEpXG4gICAgICAgICAgICAgIHN0YXRzWzBdLm1lbV9wZXJjZW50ID0gKHN0YXRzWzBdLm1lbV9wZXJjZW50KS50b0ZpeGVkKDEpXG4gICAgICAgICAgICAgIHN0YXRzWzBdLm5ldElPLnR4ID0gKHN0YXRzWzBdLm5ldElPLnR4IC8gREVGQVVMVF9DT05WRVJTSU9OKS50b0ZpeGVkKDEpXG4gICAgICAgICAgICAgIHN0YXRzWzBdLm5ldElPLnJ4ID0gKHN0YXRzWzBdLm5ldElPLnJ4IC8gREVGQVVMVF9DT05WRVJTSU9OKS50b0ZpeGVkKDEpXG5cbiAgICAgICAgICAgICAgc3RhdHNbMF0uYmxvY2tJTy53ID0gKHN0YXRzWzBdLmJsb2NrSU8udyAvIERFRkFVTFRfQ09OVkVSU0lPTikudG9GaXhlZCgxKVxuICAgICAgICAgICAgICBzdGF0c1swXS5ibG9ja0lPLnIgPSAoc3RhdHNbMF0uYmxvY2tJTy5yIC8gREVGQVVMVF9DT05WRVJTSU9OKS50b0ZpeGVkKDEpXG5cbiAgICAgICAgICAgICAgbWV0YS5zdGF0cyA9IEFycmF5LmlzQXJyYXkoc3RhdHMpID09IHRydWUgPyBzdGF0c1swXSA6IG51bGxcbiAgICAgICAgICAgICAgbmV3X2NvbnRhaW5lcnMucHVzaChtZXRhKVxuICAgICAgICAgICAgICBuZXh0KClcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZSA9PiB7XG4gICAgICAgICAgICAgIGRlYnVnKGUpXG4gICAgICAgICAgICAgIG5leHQoKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSwgKGVycikgPT4ge1xuICAgICAgICAgIGlmIChlcnIpXG4gICAgICAgICAgICBkZWJ1ZyhlcnIpXG4gICAgICAgICAgdGhpcy5pbmZvcy5jb250YWluZXJzID0gbmV3X2NvbnRhaW5lcnMuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICAgICAgdmFyIHRleHRBID0gYS5uYW1lLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgICAgICB2YXIgdGV4dEIgPSBiLm5hbWUudG9VcHBlckNhc2UoKTtcbiAgICAgICAgICAgIHJldHVybiAodGV4dEEgPCB0ZXh0QikgPyAtMSA6ICh0ZXh0QSA+IHRleHRCKSA/IDEgOiAwO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgcmV0dXJuIGNiKClcbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZSA9PiB7XG4gICAgICAgIGRlYnVnKGUpXG4gICAgICAgIHJldHVybiBjYigpXG4gICAgICB9KVxuICB9XG5cbiAgc2VydmljZXNTdW1tYXJ5KCkge1xuICAgIHN5c2luZm8uc2VydmljZXMoJyonKVxuICAgICAgLnRoZW4oc2VydmljZXMgPT4ge1xuICAgICAgICB0aGlzLmluZm9zLnNlcnZpY2VzLnJ1bm5pbmcgPSBzZXJ2aWNlcy5maWx0ZXIoc2VydmljZSA9PiBzZXJ2aWNlLnJ1bm5pbmcgPT09IHRydWUpXG4gICAgICAgIHRoaXMuaW5mb3Muc2VydmljZXMuc3RvcHBlZCA9IHNlcnZpY2VzLmZpbHRlcihzZXJ2aWNlID0+IHNlcnZpY2UucnVubmluZyA9PT0gZmFsc2UpXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGUgPT4ge1xuICAgICAgICBkZWJ1ZyhlKVxuICAgICAgfSlcbiAgfVxuXG4gIHByb2Nlc3Nlc1N1bW1hcnkoY2IpIHtcbiAgICBwc0xpc3QoKVxuICAgICAgLnRoZW4ocHJvY2Vzc2VzID0+IHtcbiAgICAgICAgdGhpcy5pbmZvcy5wcm9jZXNzZXMuY3B1X3NvcnRlZCA9IHByb2Nlc3Nlc1xuICAgICAgICAgIC5maWx0ZXIoKGE6IGFueSkgPT4gIShhLmNtZC5pbmNsdWRlcygnU3lzdGVtSW5mbycpICYmIGEuY21kLmluY2x1ZGVzKCdQTTInKSkpXG4gICAgICAgICAgLnNvcnQoKGE6IGFueSwgYjogYW55KSA9PiBiLmNwdSAtIGEuY3B1KS5zbGljZSgwLCA1KVxuICAgICAgICB0aGlzLmluZm9zLnByb2Nlc3Nlcy5tZW1fc29ydGVkID0gcHJvY2Vzc2VzXG4gICAgICAgICAgLmZpbHRlcigoYTogYW55KSA9PiAhKGEuY21kLmluY2x1ZGVzKCdTeXN0ZW1JbmZvJykgJiYgYS5jbWQuaW5jbHVkZXMoJ1BNMicpKSlcbiAgICAgICAgICAuc29ydCgoYTogYW55LCBiOiBhbnkpID0+IGIubWVtb3J5IC0gYS5tZW1vcnkpLnNsaWNlKDAsIDUpXG4gICAgICAgIHJldHVybiBjYigpXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGUgPT4ge1xuICAgICAgICBkZWJ1ZyhgRXJyb3Igd2hlbiByZXRyaWV2aW5nIHByb2Nlc3MgbGlzdGAsIGUpXG4gICAgICAgIHJldHVybiBjYigpXG4gICAgICB9KVxuICB9XG5cbiAgY3B1U3RhdHNXb3JrZXIoKSB7XG4gICAgdmFyIGNwdVRlbXBDb2xsZWN0aW9uXG5cbiAgICAoY3B1VGVtcENvbGxlY3Rpb24gPSAoKSA9PiB7XG4gICAgICBzeXNpbmZvLmNwdVRlbXBlcmF0dXJlKClcbiAgICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgICAgdGhpcy5pbmZvcy5jcHUudGVtcGVyYXR1cmUgPSBkYXRhLm1haW5cbiAgICAgICAgICBzZXRUaW1lb3V0KGNwdVRlbXBDb2xsZWN0aW9uLmJpbmQodGhpcyksIDIwMDApXG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlID0+IHtcbiAgICAgICAgICBzZXRUaW1lb3V0KGNwdVRlbXBDb2xsZWN0aW9uLmJpbmQodGhpcyksIDIwMDApXG4gICAgICAgIH0pXG4gICAgfSkoKVxuXG4gICAgZnVuY3Rpb24gZmV0Y2goKSB7XG4gICAgICBjb25zdCBzdGFydE1lYXN1cmUgPSBjb21wdXRlVXNhZ2UoKVxuXG4gICAgICBzZXRUaW1lb3V0KF8gPT4ge1xuICAgICAgICB2YXIgZW5kTWVhc3VyZSA9IGNvbXB1dGVVc2FnZSgpXG5cbiAgICAgICAgdmFyIGlkbGVEaWZmZXJlbmNlID0gZW5kTWVhc3VyZS5pZGxlIC0gc3RhcnRNZWFzdXJlLmlkbGVcbiAgICAgICAgdmFyIHRvdGFsRGlmZmVyZW5jZSA9IGVuZE1lYXN1cmUudG90YWwgLSBzdGFydE1lYXN1cmUudG90YWxcblxuICAgICAgICB2YXIgcGVyY2VudGFnZUNQVSA9ICgxMDAwMCAtIE1hdGgucm91bmQoMTAwMDAgKiBpZGxlRGlmZmVyZW5jZSAvIHRvdGFsRGlmZmVyZW5jZSkpIC8gMTAwXG4gICAgICAgIHRoaXMuaW5mb3MuY3B1LnVzYWdlID0gKHBlcmNlbnRhZ2VDUFUpLnRvRml4ZWQoMSlcbiAgICAgIH0sIDEwMClcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjb21wdXRlVXNhZ2UoKSB7XG4gICAgICBsZXQgdG90YWxJZGxlID0gMFxuICAgICAgbGV0IHRvdGFsVGljayA9IDBcbiAgICAgIGNvbnN0IGNwdXMgPSBvcy5jcHVzKClcblxuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGNwdXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgdmFyIGNwdSA9IGNwdXNbaV1cbiAgICAgICAgZm9yIChsZXQgdHlwZSBpbiBjcHUudGltZXMpIHtcbiAgICAgICAgICB0b3RhbFRpY2sgKz0gY3B1LnRpbWVzW3R5cGVdXG4gICAgICAgIH1cbiAgICAgICAgdG90YWxJZGxlICs9IGNwdS50aW1lcy5pZGxlXG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGlkbGU6IHBhcnNlSW50KCh0b3RhbElkbGUgLyBjcHVzLmxlbmd0aCkgKyBcIlwiKSxcbiAgICAgICAgdG90YWw6IHBhcnNlSW50KCh0b3RhbFRpY2sgLyBjcHVzLmxlbmd0aCkgKyBcIlwiKVxuICAgICAgfVxuICAgIH1cblxuICAgIHNldEludGVydmFsKGZldGNoLmJpbmQodGhpcyksIDEwMDApXG4gICAgZmV0Y2guYmluZCh0aGlzKSgpXG4gIH1cblxuICBtZW1TdGF0cyhjYikge1xuICAgIHN5c2luZm8ubWVtKClcbiAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICB0aGlzLmluZm9zLm1lbS50b3RhbCA9IChkYXRhLnRvdGFsIC8gREVGQVVMVF9DT05WRVJTSU9OKS50b0ZpeGVkKDIpXG4gICAgICAgIHRoaXMuaW5mb3MubWVtLmZyZWUgPSAoZGF0YS5mcmVlIC8gREVGQVVMVF9DT05WRVJTSU9OKS50b0ZpeGVkKDIpXG4gICAgICAgIHRoaXMuaW5mb3MubWVtLmFjdGl2ZSA9IChkYXRhLmFjdGl2ZSAvIERFRkFVTFRfQ09OVkVSU0lPTikudG9GaXhlZCgyKVxuICAgICAgICB0aGlzLmluZm9zLm1lbS5hdmFpbGFibGUgPSAoZGF0YS5hdmFpbGFibGUgLyBERUZBVUxUX0NPTlZFUlNJT04pLnRvRml4ZWQoMilcbiAgICAgICAgcmV0dXJuIGNiKClcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZSA9PiB7XG4gICAgICAgIGRlYnVnKGBFcnJvciB3aGlsZSBnZXR0aW5nIG1lbW9yeSBpbmZvYCwgZSlcbiAgICAgICAgcmV0dXJuIGNiKClcbiAgICAgIH0pXG4gIH1cblxuICBuZXR3b3JrQ29ubmVjdGlvbnNXb3JrZXIoKSB7XG4gICAgdmFyIHJldHJpZXZlQ29ublxuXG4gICAgKHJldHJpZXZlQ29ubiA9ICgpID0+IHtcbiAgICAgIHN5c2luZm8ubmV0d29ya0Nvbm5lY3Rpb25zKClcbiAgICAgICAgLnRoZW4oY29ubnMgPT4ge1xuICAgICAgICAgIHRoaXMuaW5mb3MuY29ubmVjdGlvbnMgPSBjb25uc1xuICAgICAgICAgICAgLmZpbHRlcihjb25uID0+IGNvbm4ubG9jYWxwb3J0ICE9ICc0NDMnICYmIGNvbm4ucGVlcnBvcnQgIT0gJzQ0MycpXG4gICAgICAgICAgICAubWFwKChjb25uOiBhbnkpID0+IGAke2Nvbm4ubG9jYWxhZGRyZXNzfToke2Nvbm4ubG9jYWxwb3J0fS0ke2Nvbm4ucGVlcmFkZHJlc3N9OiR7Y29ubi5wZWVycG9ydH0tJHtjb25uLnByb2MgPyBjb25uLnByb2MgOiAndW5rbm93bid9YClcbiAgICAgICAgICBzZXRUaW1lb3V0KHJldHJpZXZlQ29ubi5iaW5kKHRoaXMpLCAxMCAqIDEwMDApXG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlID0+IHtcbiAgICAgICAgICBkZWJ1ZyhgRXJyb3Igd2hpbGUgcmV0cmlldmluZyBmaWxlc3lzdGVtIGluZm9zYCwgZSlcbiAgICAgICAgICBzZXRUaW1lb3V0KHJldHJpZXZlQ29ubi5iaW5kKHRoaXMpLCAxMCAqIDEwMDApXG4gICAgICAgIH0pXG4gICAgfSkoKTtcbiAgfVxuXG4gIGRpc2tzU3RhdHNXb3JrZXIoKSB7XG4gICAgdmFyIHJ4ID0gMFxuICAgIHZhciB3eCA9IDBcbiAgICB2YXIgc3RhcnRlZCA9IGZhbHNlXG4gICAgdmFyIGZzU2l6ZUNvbGxlY3Rpb24sIGlvQ29sbGVjdGlvblxuXG4gICAgKGZzU2l6ZUNvbGxlY3Rpb24gPSAoKSA9PiB7XG4gICAgICBzeXNpbmZvLmZzU2l6ZSgpXG4gICAgICAgIC50aGVuKGZzcyA9PiB7XG4gICAgICAgICAgdmFyIGZzZSA9IGZzcy5maWx0ZXIoZnMgPT4gKGZzLnNpemUgLyAoMTAyNCAqIDEwMjQpKSA+IDIwMClcbiAgICAgICAgICB0aGlzLmluZm9zLnN0b3JhZ2UuZmlsZXN5c3RlbXMgPSBmc2VcbiAgICAgICAgICBzZXRUaW1lb3V0KGZzU2l6ZUNvbGxlY3Rpb24uYmluZCh0aGlzKSwgMzAgKiAxMDAwKVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZSA9PiB7XG4gICAgICAgICAgZGVidWcoYEVycm9yIHdoaWxlIHJldHJpZXZpbmcgZmlsZXN5c3RlbSBpbmZvc2AsIGUpXG4gICAgICAgICAgc2V0VGltZW91dChmc1NpemVDb2xsZWN0aW9uLmJpbmQodGhpcyksIDEwICogMTAwMClcbiAgICAgICAgfSlcbiAgICB9KSgpO1xuXG4gICAgKGlvQ29sbGVjdGlvbiA9ICgpID0+IHtcbiAgICAgIHN5c2luZm8uZnNTdGF0cygpXG4gICAgICAgIC50aGVuKChmc19zdGF0czogYW55KSA9PiB7XG4gICAgICAgICAgdmFyIG5ld19yeCA9IGZzX3N0YXRzLnJ4XG4gICAgICAgICAgdmFyIG5ld193eCA9IGZzX3N0YXRzLnd4XG5cbiAgICAgICAgICB2YXIgcmVhZCA9ICgobmV3X3J4IC0gcngpIC8gREVGQVVMVF9DT05WRVJTSU9OKS50b0ZpeGVkKDMpXG4gICAgICAgICAgdmFyIHdyaXRlID0gKChuZXdfd3ggLSB3eCkgLyBERUZBVUxUX0NPTlZFUlNJT04pLnRvRml4ZWQoMylcblxuICAgICAgICAgIGlmIChzdGFydGVkID09IHRydWUpIHtcbiAgICAgICAgICAgIHRoaXMuaW5mb3Muc3RvcmFnZS5pby5yZWFkLmFkZChwYXJzZUZsb2F0KHJlYWQpKVxuICAgICAgICAgICAgdGhpcy5pbmZvcy5zdG9yYWdlLmlvLndyaXRlLmFkZChwYXJzZUZsb2F0KHdyaXRlKSlcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByeCA9IG5ld19yeFxuICAgICAgICAgIHd4ID0gbmV3X3d4XG4gICAgICAgICAgc3RhcnRlZCA9IHRydWVcbiAgICAgICAgICBzZXRUaW1lb3V0KGlvQ29sbGVjdGlvbi5iaW5kKHRoaXMpLCAxMDAwKVxuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZSA9PiB7XG4gICAgICAgICAgZGVidWcoYEVycm9yIHdoaWxlIGdldHRpbmcgbmV0d29yayBzdGF0aXN0aWNzYCwgZSlcbiAgICAgICAgICBzZXRUaW1lb3V0KGlvQ29sbGVjdGlvbi5iaW5kKHRoaXMpLCAxMDAwKVxuICAgICAgICB9KVxuICAgIH0pKCk7XG4gIH1cblxuICBmZFN0YXRzV29ya2VyKCkge1xuICAgIHZhciBnZXRGRE9wZW5lZCA9ICgpID0+IHtcbiAgICAgIGZzLnJlYWRGaWxlKCcvcHJvYy9zeXMvZnMvZmlsZS1ucicsIChlcnIsIG91dCkgPT4ge1xuICAgICAgICBpZiAoZXJyKSByZXR1cm5cbiAgICAgICAgY29uc3Qgb3V0cHV0ID0gb3V0LnRvU3RyaW5nKCkudHJpbSgpXG4gICAgICAgIGNvbnN0IHBhcnNlZCA9IG91dHB1dC5zcGxpdCgnXFx0JylcbiAgICAgICAgaWYgKHBhcnNlZC5sZW5ndGggIT09IDMpIHJldHVyblxuICAgICAgICB0aGlzLmluZm9zLmZkLm9wZW5lZCA9IHBhcnNlSW50KHBhcnNlZFswXSlcbiAgICAgICAgdGhpcy5pbmZvcy5mZC5tYXggPSBwYXJzZUludChwYXJzZWRbMl0pXG4gICAgICB9KVxuICAgIH1cblxuICAgIHNldEludGVydmFsKCgpID0+IHtcbiAgICAgIGdldEZET3BlbmVkKClcbiAgICB9LCAyMCAqIDEwMDApXG5cbiAgICBnZXRGRE9wZW5lZCgpXG4gIH1cblxuICBuZXR3b3JrU3RhdHNXb3JrZXIoKSB7XG4gICAgdmFyIGxhdGVuY3lDb2xsZWN0aW9uLCBuZXR3b3JrU3RhdHNDb2xsZWN0aW9uXG5cbiAgICAvLyAobGF0ZW5jeUNvbGxlY3Rpb24gPSAoKSA9PiB7XG4gICAgLy8gICBzeXNpbmZvLmluZXRMYXRlbmN5KClcbiAgICAvLyAgICAgLnRoZW4obGF0ZW5jeSA9PiB7XG4gICAgLy8gICAgICAgdGhpcy5pbmZvcy5uZXR3b3JrLmxhdGVuY3kuYWRkKGxhdGVuY3kpXG4gICAgLy8gICAgICAgc2V0VGltZW91dChsYXRlbmN5Q29sbGVjdGlvbi5iaW5kKHRoaXMpLCAyMDAwKVxuICAgIC8vICAgICB9KVxuICAgIC8vICAgICAuY2F0Y2goZSA9PiB7XG4gICAgLy8gICAgICAgZGVidWcoZSlcbiAgICAvLyAgICAgICBzZXRUaW1lb3V0KGxhdGVuY3lDb2xsZWN0aW9uLmJpbmQodGhpcyksIDIwMDApXG4gICAgLy8gICAgIH0pXG4gICAgLy8gfSkoKVxuXG4gICAgc3lzaW5mby5uZXR3b3JrSW50ZXJmYWNlRGVmYXVsdCgobmV0X2ludGVyZmFjZSkgPT4ge1xuICAgICAgdmFyIHN0YXJ0ZWQgPSBmYWxzZVxuICAgICAgdmFyIHJ4ID0gMFxuICAgICAgdmFyIHR4ID0gMFxuICAgICAgdmFyIHJ4X2UgPSAwXG4gICAgICB2YXIgdHhfZSA9IDBcbiAgICAgIHZhciByeF9kID0gMFxuICAgICAgdmFyIHR4X2QgPSAwO1xuXG4gICAgICAobmV0d29ya1N0YXRzQ29sbGVjdGlvbiA9ICgpID0+IHtcbiAgICAgICAgc3lzaW5mby5uZXR3b3JrU3RhdHMobmV0X2ludGVyZmFjZSlcbiAgICAgICAgICAudGhlbigobmV0KSA9PiB7XG4gICAgICAgICAgICB2YXIgbmV3X3J4ID0gKG5ldFswXS5yeF9ieXRlcyAtIHJ4KSAvIERFRkFVTFRfQ09OVkVSU0lPTlxuICAgICAgICAgICAgdmFyIG5ld190eCA9IChuZXRbMF0udHhfYnl0ZXMgLSB0eCkgLyBERUZBVUxUX0NPTlZFUlNJT05cbiAgICAgICAgICAgIHJ4ID0gbmV0WzBdLnJ4X2J5dGVzXG4gICAgICAgICAgICB0eCA9IG5ldFswXS50eF9ieXRlc1xuXG4gICAgICAgICAgICB2YXIgbmV3X3J4X2UgPSAobmV0WzBdLnJ4X2Vycm9ycyAtIHJ4X2UpIC8gREVGQVVMVF9DT05WRVJTSU9OXG4gICAgICAgICAgICB2YXIgbmV3X3R4X2UgPSAobmV0WzBdLnR4X2Vycm9ycyAtIHR4X2UpIC8gREVGQVVMVF9DT05WRVJTSU9OXG4gICAgICAgICAgICByeF9lID0gbmV0WzBdLnJ4X2Vycm9yc1xuICAgICAgICAgICAgdHhfZSA9IG5ldFswXS50eF9lcnJvcnNcblxuICAgICAgICAgICAgdmFyIG5ld19yeF9kID0gKG5ldFswXS5yeF9kcm9wcGVkIC0gcnhfZCkgLyBERUZBVUxUX0NPTlZFUlNJT05cbiAgICAgICAgICAgIHZhciBuZXdfdHhfZCA9IChuZXRbMF0udHhfZHJvcHBlZCAtIHR4X2QpIC8gREVGQVVMVF9DT05WRVJTSU9OXG4gICAgICAgICAgICByeF9kID0gbmV0WzBdLnJ4X2Ryb3BwZWRcbiAgICAgICAgICAgIHR4X2QgPSBuZXRbMF0udHhfZHJvcHBlZFxuXG4gICAgICAgICAgICBpZiAoc3RhcnRlZCA9PSB0cnVlKSB7XG4gICAgICAgICAgICAgIHRoaXMuaW5mb3MubmV0d29yay5yeF81LmFkZChuZXdfcngpXG4gICAgICAgICAgICAgIHRoaXMuaW5mb3MubmV0d29yay50eF81LmFkZChuZXdfdHgpXG4gICAgICAgICAgICAgIHRoaXMuaW5mb3MubmV0d29yay5yeF9lcnJvcnNfNjAuYWRkKG5ld19yeF9lKVxuICAgICAgICAgICAgICB0aGlzLmluZm9zLm5ldHdvcmsudHhfZXJyb3JzXzYwLmFkZChuZXdfdHhfZSlcbiAgICAgICAgICAgICAgdGhpcy5pbmZvcy5uZXR3b3JrLnJ4X2Ryb3BwZWRfNjAuYWRkKG5ld19yeF9kKVxuICAgICAgICAgICAgICB0aGlzLmluZm9zLm5ldHdvcmsudHhfZHJvcHBlZF82MC5hZGQobmV3X3R4X2QpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdGFydGVkID0gdHJ1ZVxuICAgICAgICAgICAgc2V0VGltZW91dChuZXR3b3JrU3RhdHNDb2xsZWN0aW9uLmJpbmQodGhpcyksIDEwMDApXG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZSA9PiB7XG4gICAgICAgICAgICBkZWJ1ZyhgRXJyb3Igb24gcmV0cmlldmluZyBuZXR3b3JrIHN0YXRzYCwgZSlcbiAgICAgICAgICAgIHNldFRpbWVvdXQobmV0d29ya1N0YXRzQ29sbGVjdGlvbi5iaW5kKHRoaXMpLCA5MDApXG4gICAgICAgICAgfSlcbiAgICAgIH0pKClcbiAgICB9KVxuXG4gIH1cbn1cblxuaWYgKHJlcXVpcmUubWFpbiA9PT0gbW9kdWxlKSB7XG4gIHZhciBzeXMgPSBuZXcgU3lzdGVtSW5mbygpXG4gIHN5cy5zdGFydENvbGxlY3Rpb24oKVxufVxuXG5leHBvcnQgZGVmYXVsdCBTeXN0ZW1JbmZvXG4iXX0=