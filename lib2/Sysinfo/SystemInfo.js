"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _systeminformation = _interopRequireDefault(require("systeminformation"));

var _psList = _interopRequireDefault(require("./psList"));

var _async = _interopRequireDefault(require("async"));

var _MeanCalc = _interopRequireDefault(require("./MeanCalc"));

var _child_process = require("child_process");

var _os = _interopRequireDefault(require("os"));

var _fs = _interopRequireDefault(require("fs"));

var _debug = _interopRequireDefault(require("debug"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var debug = (0, _debug["default"])('pm2:sysinfos');
var DEFAULT_CONVERSION = 1024 * 1024;

var SystemInfo = /*#__PURE__*/function () {
  function SystemInfo() {
    _classCallCheck(this, SystemInfo);

    _defineProperty(this, "infos", void 0);

    _defineProperty(this, "ping_timeout", void 0);

    _defineProperty(this, "restart", void 0);

    _defineProperty(this, "process", void 0);

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


  _createClass(SystemInfo, [{
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9TeXNpbmZvL1N5c3RlbUluZm8udHMiXSwibmFtZXMiOlsiZGVidWciLCJERUZBVUxUX0NPTlZFUlNJT04iLCJTeXN0ZW1JbmZvIiwiaW5mb3MiLCJiYXNlYm9hcmQiLCJtb2RlbCIsInZlcnNpb24iLCJjcHUiLCJtYW51ZmFjdHVyZXIiLCJicmFuZCIsInNwZWVkbWF4IiwiY29yZXMiLCJwaHlzaWNhbENvcmVzIiwicHJvY2Vzc29ycyIsInRlbXBlcmF0dXJlIiwidXNhZ2UiLCJtZW0iLCJ0b3RhbCIsImZyZWUiLCJhY3RpdmUiLCJvcyIsInBsYXRmb3JtIiwiZGlzdHJvIiwicmVsZWFzZSIsImNvZGVuYW1lIiwia2VybmVsIiwiYXJjaCIsImZkIiwib3BlbmVkIiwibWF4Iiwic3RvcmFnZSIsImlvIiwicmVhZCIsIk1lYW5DYWxjIiwid3JpdGUiLCJwaHlzaWNhbF9kaXNrcyIsImRldmljZSIsInR5cGUiLCJuYW1lIiwiaW50ZXJmYWNlVHlwZSIsInZlbmRvciIsImZpbGVzeXN0ZW1zIiwiY29ubmVjdGlvbnMiLCJuZXR3b3JrIiwibGF0ZW5jeSIsInR4XzUiLCJyeF81IiwicnhfZXJyb3JzXzYwIiwidHhfZXJyb3JzXzYwIiwidHhfZHJvcHBlZF82MCIsInJ4X2Ryb3BwZWRfNjAiLCJjb250YWluZXJzIiwicHJvY2Vzc2VzIiwiY3B1X3NvcnRlZCIsIm1lbV9zb3J0ZWQiLCJzZXJ2aWNlcyIsInJ1bm5pbmciLCJzdG9wcGVkIiwicmVzdGFydCIsInBpbmdfdGltZW91dCIsInJlcG9ydCIsIkpTT04iLCJwYXJzZSIsInN0cmluZ2lmeSIsInZhbCIsInByb2Nlc3MiLCJfX2ZpbGVuYW1lIiwiZGV0YWNoZWQiLCJ3aW5kb3dzSGlkZSIsInN0ZGlvIiwib24iLCJjb2RlIiwiY29uc29sZSIsImxvZyIsImUiLCJtc2ciLCJjbWQiLCJjb25uZWN0ZWQiLCJzZW5kIiwiZXJyb3IiLCJjYiIsIkVycm9yIiwicmVzIiwibGlzdGVuZXIiLCJyZW1vdmVMaXN0ZW5lciIsImRhdGEiLCJraWxsIiwic3RhdGljSW5mb3JtYXRpb25zIiwiZG9ja2VyQ29sbGVjdGlvbiIsInByb2Nlc3NDb2xsZWN0aW9uIiwibWVtQ29sbGVjdGlvbiIsInNlcnZpY2VzQ29sbGVjdGlvbiIsImRvY2tlclN1bW1hcnkiLCJzZXRUaW1lb3V0IiwiYmluZCIsInByb2Nlc3Nlc1N1bW1hcnkiLCJtZW1TdGF0cyIsIm5ldHdvcmtDb25uZWN0aW9uc1dvcmtlciIsImRpc2tzU3RhdHNXb3JrZXIiLCJuZXR3b3JrU3RhdHNXb3JrZXIiLCJjcHVTdGF0c1dvcmtlciIsImZkU3RhdHNXb3JrZXIiLCJzZXRJbnRlcnZhbCIsImV4aXQiLCJjbGVhclRpbWVvdXQiLCJnZXRDUFUiLCJzeXNpbmZvIiwidGhlbiIsInNwZWVkIiwiZ2V0QmFzZWJvYXJkIiwic3lzdGVtIiwiZ2V0T3NJbmZvIiwib3NJbmZvIiwiZGlza0xheW91dCIsImRpc2tzIiwiZm9yRWFjaCIsImRpc2siLCJwdXNoIiwiZG9ja2VyQ29udGFpbmVycyIsIm5vbl9leGl0ZWRfY29udGFpbmVycyIsImZpbHRlciIsImNvbnRhaW5lciIsInN0YXRlIiwibmV3X2NvbnRhaW5lcnMiLCJhc3luYyIsIm5leHQiLCJkb2NrZXJDb250YWluZXJTdGF0cyIsImlkIiwic3RhdHMiLCJtZXRhIiwiY3B1X3BlcmNlbnQiLCJ0b0ZpeGVkIiwibWVtX3BlcmNlbnQiLCJuZXRJTyIsInR4IiwicngiLCJibG9ja0lPIiwidyIsInIiLCJBcnJheSIsImlzQXJyYXkiLCJlcnIiLCJzb3J0IiwiYSIsImIiLCJ0ZXh0QSIsInRvVXBwZXJDYXNlIiwidGV4dEIiLCJzZXJ2aWNlIiwiaW5jbHVkZXMiLCJzbGljZSIsIm1lbW9yeSIsImNwdVRlbXBDb2xsZWN0aW9uIiwiY3B1VGVtcGVyYXR1cmUiLCJtYWluIiwiZmV0Y2giLCJzdGFydE1lYXN1cmUiLCJjb21wdXRlVXNhZ2UiLCJfIiwiZW5kTWVhc3VyZSIsImlkbGVEaWZmZXJlbmNlIiwiaWRsZSIsInRvdGFsRGlmZmVyZW5jZSIsInBlcmNlbnRhZ2VDUFUiLCJNYXRoIiwicm91bmQiLCJ0b3RhbElkbGUiLCJ0b3RhbFRpY2siLCJjcHVzIiwiaSIsImxlbiIsImxlbmd0aCIsInRpbWVzIiwicGFyc2VJbnQiLCJhdmFpbGFibGUiLCJyZXRyaWV2ZUNvbm4iLCJuZXR3b3JrQ29ubmVjdGlvbnMiLCJjb25ucyIsImNvbm4iLCJsb2NhbHBvcnQiLCJwZWVycG9ydCIsIm1hcCIsImxvY2FsYWRkcmVzcyIsInBlZXJhZGRyZXNzIiwicHJvYyIsInd4Iiwic3RhcnRlZCIsImZzU2l6ZUNvbGxlY3Rpb24iLCJpb0NvbGxlY3Rpb24iLCJmc1NpemUiLCJmc3MiLCJmc2UiLCJmcyIsInNpemUiLCJmc1N0YXRzIiwiZnNfc3RhdHMiLCJuZXdfcngiLCJuZXdfd3giLCJhZGQiLCJwYXJzZUZsb2F0IiwiZ2V0RkRPcGVuZWQiLCJyZWFkRmlsZSIsIm91dCIsIm91dHB1dCIsInRvU3RyaW5nIiwidHJpbSIsInBhcnNlZCIsInNwbGl0IiwibGF0ZW5jeUNvbGxlY3Rpb24iLCJuZXR3b3JrU3RhdHNDb2xsZWN0aW9uIiwibmV0d29ya0ludGVyZmFjZURlZmF1bHQiLCJuZXRfaW50ZXJmYWNlIiwicnhfZSIsInR4X2UiLCJyeF9kIiwidHhfZCIsIm5ldHdvcmtTdGF0cyIsIm5ldCIsInJ4X2J5dGVzIiwibmV3X3R4IiwidHhfYnl0ZXMiLCJuZXdfcnhfZSIsInJ4X2Vycm9ycyIsIm5ld190eF9lIiwidHhfZXJyb3JzIiwibmV3X3J4X2QiLCJyeF9kcm9wcGVkIiwibmV3X3R4X2QiLCJ0eF9kcm9wcGVkIiwicmVxdWlyZSIsIm1vZHVsZSIsInN5cyIsInN0YXJ0Q29sbGVjdGlvbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOzs7Ozs7Ozs7Ozs7QUFFQSxJQUFNQSxLQUFLLEdBQUcsdUJBQVksY0FBWixDQUFkO0FBRUEsSUFBTUMsa0JBQWtCLEdB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LHNDQUFzQzBFLENBQXRDLENBQUw7QUFDQW1CLFlBQUFBLFVBQVUsQ0FBQ29ILHVCQUFzQixDQUFDbkgsSUFBdkIsQ0FBNEIsT0FBNUIsQ0FBRCxFQUFvQyxHQUFwQyxDQUFWO0FBQ0QsV0EvQkg7QUFnQ0QsU0FqQ0Q7QUFrQ0QsT0EzQ0Q7QUE2Q0Q7Ozs7OztBQUdILElBQUl1SSxPQUFPLENBQUMzRSxJQUFSLEtBQWlCNEUsTUFBckIsRUFBNkI7QUFDM0IsTUFBSUMsR0FBRyxHQUFHLElBQUlyTyxVQUFKLEVBQVY7QUFDQXFPLEVBQUFBLEdBQUcsQ0FBQ0MsZUFBSjtBQUNEOztlQUVjdE8sVSIsInNvdXJjZXNDb250ZW50IjpbIlxyXG5pbXBvcnQgc3lzaW5mbyBmcm9tICdzeXN0ZW1pbmZvcm1hdGlvbidcclxuaW1wb3J0IHBzTGlzdCBmcm9tICcuL3BzTGlzdCdcclxuaW1wb3J0IGFzeW5jIGZyb20gJ2FzeW5jJ1xyXG5pbXBvcnQgTWVhbkNhbGMgZnJvbSAnLi9NZWFuQ2FsYydcclxuaW1wb3J0IHsgZm9yayB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnXHJcbmltcG9ydCBvcyBmcm9tICdvcydcclxuaW1wb3J0IGZzIGZyb20gJ2ZzJ1xyXG5pbXBvcnQgZGVidWdMb2dnZXIgZnJvbSAnZGVidWcnXHJcblxyXG5jb25zdCBkZWJ1ZyA9IGRlYnVnTG9nZ2VyKCdwbTI6c3lzaW5mb3MnKTtcclxuXHJcbmNvbnN0IERFRkFVTFRfQ09OVkVSU0lPTiA9IDEwMjQgKiAxMDI0XHJcblxyXG5jbGFzcyBTeXN0ZW1JbmZvIHtcclxuICBpbmZvczogYW55O1xyXG4gIHBpbmdfdGltZW91dDogTm9kZUpTLlRpbWVvdXQ7XHJcbiAgcmVzdGFydDogYm9vbGVhbjtcclxuICBwcm9jZXNzOiBhbnk7XHJcblxyXG4gIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgdGhpcy5pbmZvcyA9IHtcclxuICAgICAgYmFzZWJvYXJkOiB7XHJcbiAgICAgICAgbW9kZWw6IG51bGwsXHJcbiAgICAgICAgdmVyc2lvbjogbnVsbFxyXG4gICAgICB9LFxyXG4gICAgICBjcHU6IHtcclxuICAgICAgICBtYW51ZmFjdHVyZXI6IG51bGwsXHJcbiAgICAgICAgYnJhbmQ6IG51bGwsXHJcbiAgICAgICAgc3BlZWRtYXg6IG51bGwsXHJcbiAgICAgICAgY29yZXM6IG51bGwsXHJcbiAgICAgICAgcGh5c2ljYWxDb3JlczogbnVsbCxcclxuICAgICAgICBwcm9jZXNzb3JzOiBudWxsLFxyXG4gICAgICAgIHRlbXBlcmF0dXJlOiBudWxsLFxyXG4gICAgICAgIHVzYWdlOiBudWxsXHJcbiAgICAgIH0sXHJcbiAgICAgIG1lbToge1xyXG4gICAgICAgIHRvdGFsOiBudWxsLFxyXG4gICAgICAgIGZyZWU6IG51bGwsXHJcbiAgICAgICAgYWN0aXZlOiBudWxsXHJcbiAgICAgIH0sXHJcbiAgICAgIG9zOiB7XHJcbiAgICAgICAgcGxhdGZvcm06IG51bGwsXHJcbiAgICAgICAgZGlzdHJvOiBudWxsLFxyXG4gICAgICAgIHJlbGVhc2U6IG51bGwsXHJcbiAgICAgICAgY29kZW5hbWU6IG51bGwsXHJcbiAgICAgICAga2VybmVsOiBudWxsLFxyXG4gICAgICAgIGFyY2g6IG51bGwsXHJcbiAgICAgIH0sXHJcbiAgICAgIGZkOiB7XHJcbiAgICAgICAgb3BlbmVkOiBudWxsLFxyXG4gICAgICAgIG1heDogbnVsbFxyXG4gICAgICB9LFxyXG4gICAgICBzdG9yYWdlOiB7XHJcbiAgICAgICAgaW86IHtcclxuICAgICAgICAgIHJlYWQ6IG5ldyBNZWFuQ2FsYygxNSksXHJcbiAgICAgICAgICB3cml0ZTogbmV3IE1lYW5DYWxjKDE1KVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcGh5c2ljYWxfZGlza3M6IFt7XHJcbiAgICAgICAgICBkZXZpY2U6IG51bGwsXHJcbiAgICAgICAgICB0eXBlOiBudWxsLFxyXG4gICAgICAgICAgbmFtZTogbnVsbCxcclxuICAgICAgICAgIGludGVyZmFjZVR5cGU6IG51bGwsXHJcbiAgICAgICAgICB2ZW5kb3I6IG51bGxcclxuICAgICAgICB9XSxcclxuICAgICAgICBmaWxlc3lzdGVtczogW3tcclxuICAgICAgICB9XVxyXG4gICAgICB9LFxyXG4gICAgICBjb25uZWN0aW9uczogWydzb3VyY2VfaXA6c291cmNlX3BvcnQtZGVzdF9pcDpkZXN0X3BvcnQtcHJvY19uYW1lJ10sXHJcbiAgICAgIG5ldHdvcms6IHtcclxuICAgICAgICBsYXRlbmN5OiBuZXcgTWVhbkNhbGMoNSksXHJcbiAgICAgICAgdHhfNTogbmV3IE1lYW5DYWxjKDUpLFxyXG4gICAgICAgIHJ4XzU6IG5ldyBNZWFuQ2FsYyg1KSxcclxuICAgICAgICByeF9lcnJvcnNfNjA6IG5ldyBNZWFuQ2FsYyg2MCksXHJcbiAgICAgICAgdHhfZXJyb3JzXzYwOiBuZXcgTWVhbkNhbGMoNjApLFxyXG4gICAgICAgIHR4X2Ryb3BwZWRfNjA6IG5ldyBNZWFuQ2FsYyg2MCksXHJcbiAgICAgICAgcnhfZHJvcHBlZF82MDogbmV3IE1lYW5DYWxjKDYwKVxyXG4gICAgICB9LFxyXG4gICAgICAvLyBQcm9jc1xyXG4gICAgICBjb250YWluZXJzOiBbXSxcclxuICAgICAgcHJvY2Vzc2VzOiB7XHJcbiAgICAgICAgY3B1X3NvcnRlZDogbnVsbCxcclxuICAgICAgICBtZW1fc29ydGVkOiBudWxsXHJcbiAgICAgIH0sXHJcbiAgICAgIHNlcnZpY2VzOiB7XHJcbiAgICAgICAgcnVubmluZzogbnVsbCxcclxuICAgICAgICBzdG9wcGVkOiBudWxsXHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMucmVzdGFydCA9IHRydWVcclxuICAgIHRoaXMucGluZ190aW1lb3V0ID0gbnVsbFxyXG4gIH1cclxuXHJcbiAgLy8gQ2FzdCBNZWFuQ2FsYyBhbmQgb3RoZXIgb2JqZWN0IHRvIHJlYWwgdmFsdWVcclxuICAvLyBUaGlzIG1ldGhvZCByZXRyaWV2ZSB0aGUgbWFjaGluZSBzbmFwc2hvdCB3ZWxsIGZvcm1hdGVkXHJcbiAgcmVwb3J0KCkge1xyXG4gICAgdmFyIHJlcG9ydCA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkodGhpcy5pbmZvcykpXHJcbiAgICByZXBvcnQubmV0d29yay5sYXRlbmN5ID0gdGhpcy5pbmZvcy5uZXR3b3JrLmxhdGVuY3kudmFsKClcclxuICAgIHJlcG9ydC5uZXR3b3JrLnR4XzUgPSB0aGlzLmluZm9zLm5ldHdvcmsudHhfNS52YWwoKVxyXG4gICAgcmVwb3J0Lm5ldHdvcmsucnhfNSA9IHRoaXMuaW5mb3MubmV0d29yay5yeF81LnZhbCgpXHJcbiAgICByZXBvcnQubmV0d29yay5yeF9lcnJvcnNfNjAgPSB0aGlzLmluZm9zLm5ldHdvcmsucnhfZXJyb3JzXzYwLnZhbCgpXHJcbiAgICByZXBvcnQubmV0d29yay50eF9lcnJvcnNfNjAgPSB0aGlzLmluZm9zLm5ldHdvcmsudHhfZXJyb3JzXzYwLnZhbCgpXHJcbiAgICByZXBvcnQubmV0d29yay5yeF9kcm9wcGVkXzYwID0gdGhpcy5pbmZvcy5uZXR3b3JrLnJ4X2Ryb3BwZWRfNjAudmFsKClcclxuICAgIHJlcG9ydC5uZXR3b3JrLnR4X2Ryb3BwZWRfNjAgPSB0aGlzLmluZm9zLm5ldHdvcmsudHhfZHJvcHBlZF82MC52YWwoKVxyXG4gICAgcmVwb3J0LnN0b3JhZ2UuaW8ucmVhZCA9IHRoaXMuaW5mb3Muc3RvcmFnZS5pby5yZWFkLnZhbCgpXHJcbiAgICByZXBvcnQuc3RvcmFnZS5pby53cml0ZSA9IHRoaXMuaW5mb3Muc3RvcmFnZS5pby53cml0ZS52YWwoKVxyXG4gICAgcmV0dXJuIHJlcG9ydFxyXG4gIH1cclxuXHJcbiAgZm9yaygpIHtcclxuICAgIHRoaXMucHJvY2VzcyA9IGZvcmsoX19maWxlbmFtZSwge1xyXG4gICAgICBkZXRhY2hlZDogZmFsc2UsXHJcbiAgICAgIHdpbmRvd3NIaWRlOiB0cnVlLFxyXG4gICAgICBzdGRpbzogWydpbmhlcml0JywgJ2luaGVyaXQnLCAnaW5oZXJpdCcsICdpcGMnXVxyXG4gICAgfSBhcyBhbnkpXHJcblxyXG4gICAgdGhpcy5wcm9jZXNzLm9uKCdleGl0JywgKGNvZGUpID0+IHtcclxuICAgICAgY29uc29sZS5sb2coYHN5c3RlbWluZm9zIGNvbGxlY3Rpb24gcHJvY2VzcyBvZmZsaW5lIHdpdGggY29kZSAke2NvZGV9YClcclxuICAgICAgLy8gaWYgKHRoaXMucmVzdGFydCA9PSB0cnVlKVxyXG4gICAgICAvLyAgIHRoaXMuZm9yaygpXHJcbiAgICB9KVxyXG5cclxuICAgIHRoaXMucHJvY2Vzcy5vbignZXJyb3InLCAoZSkgPT4ge1xyXG4gICAgICBjb25zb2xlLmxvZyhgU3lzaW5mbyBlcnJvcmVkYCwgZSlcclxuICAgIH0pXHJcblxyXG4gICAgdGhpcy5wcm9jZXNzLm9uKCdtZXNzYWdlJywgKG1zZykgPT4ge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIG1zZyA9IEpTT04ucGFyc2UobXNnKVxyXG4gICAgICB9XHJcbiAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKG1zZy5jbWQgPT0gJ3BpbmcnKSB7XHJcbiAgICAgICAgaWYgKHRoaXMucHJvY2Vzcy5jb25uZWN0ZWQgPT0gdHJ1ZSkge1xyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgdGhpcy5wcm9jZXNzLnNlbmQoJ3BvbmcnKVxyXG4gICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdDYW5ub3Qgc2VuZCBtZXNzYWdlIHRvIFN5c2luZm9zJylcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgfVxyXG5cclxuICBxdWVyeShjYikge1xyXG4gICAgaWYgKHRoaXMucHJvY2Vzcy5jb25uZWN0ZWQgPT0gdHJ1ZSkge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIHRoaXMucHJvY2Vzcy5zZW5kKCdxdWVyeScpXHJcbiAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICByZXR1cm4gY2IobmV3IEVycm9yKCdub3QgcmVhZHkgeWV0JyksIG51bGwpXHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGVsc2VcclxuICAgICAgcmV0dXJuIGNiKG5ldyBFcnJvcignbm90IHJlYWR5IHlldCcpLCBudWxsKVxyXG5cclxuICAgIHZhciByZXMgPSAobXNnKSA9PiB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgbXNnID0gSlNPTi5wYXJzZShtc2cpXHJcbiAgICAgIH1cclxuICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKG1zZy5jbWQgPT0gJ3F1ZXJ5OnJlcycpIHtcclxuICAgICAgICBsaXN0ZW5lci5yZW1vdmVMaXN0ZW5lcignbWVzc2FnZScsIHJlcylcclxuICAgICAgICByZXR1cm4gY2IobnVsbCwgbXNnLmRhdGEpXHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB2YXIgbGlzdGVuZXIgPSB0aGlzLnByb2Nlc3Mub24oJ21lc3NhZ2UnLCByZXMpXHJcbiAgfVxyXG5cclxuICBraWxsKCkge1xyXG4gICAgdGhpcy5yZXN0YXJ0ID0gZmFsc2VcclxuICAgIHRoaXMucHJvY2Vzcy5raWxsKClcclxuICB9XHJcblxyXG4gIHN0YXJ0Q29sbGVjdGlvbigpIHtcclxuICAgIHRoaXMuc3RhdGljSW5mb3JtYXRpb25zKClcclxuXHJcbiAgICB2YXIgZG9ja2VyQ29sbGVjdGlvbiwgcHJvY2Vzc0NvbGxlY3Rpb24sIG1lbUNvbGxlY3Rpb24sIHNlcnZpY2VzQ29sbGVjdGlvblxyXG5cclxuICAgIChkb2NrZXJDb2xsZWN0aW9uID0gKCkgPT4ge1xyXG4gICAgICB0aGlzLmRvY2tlclN1bW1hcnkoKCkgPT4ge1xyXG4gICAgICAgIHNldFRpbWVvdXQoZG9ja2VyQ29sbGVjdGlvbi5iaW5kKHRoaXMpLCAzMDApXHJcbiAgICAgIH0pXHJcbiAgICB9KSgpO1xyXG5cclxuICAgIChwcm9jZXNzQ29sbGVjdGlvbiA9ICgpID0+IHtcclxuICAgICAgdGhpcy5wcm9jZXNzZXNTdW1tYXJ5KCgpID0+IHtcclxuICAgICAgICBzZXRUaW1lb3V0KHByb2Nlc3NDb2xsZWN0aW9uLmJpbmQodGhpcyksIDUwMDApXHJcbiAgICAgIH0pXHJcbiAgICB9KSgpO1xyXG5cclxuICAgIC8vIChzZXJ2aWNlc0NvbGxlY3Rpb24gPSAoKSA9PiB7XHJcbiAgICAvLyAgIHRoaXMuc2VydmljZXNTdW1tYXJ5KCgpID0+IHtcclxuICAgIC8vICAgICBzZXRUaW1lb3V0KHNlcnZpY2VzQ29sbGVjdGlvbi5iaW5kKHRoaXMpLCA2MDAwMClcclxuICAgIC8vICAgfSlcclxuICAgIC8vIH0pKCk7XHJcblxyXG4gICAgKG1lbUNvbGxlY3Rpb24gPSAoKSA9PiB7XHJcbiAgICAgIHRoaXMubWVtU3RhdHMoKCkgPT4ge1xyXG4gICAgICAgIHNldFRpbWVvdXQobWVtQ29sbGVjdGlvbi5iaW5kKHRoaXMpLCAxMDAwKVxyXG4gICAgICB9KVxyXG4gICAgfSkoKTtcclxuXHJcbiAgICB0aGlzLm5ldHdvcmtDb25uZWN0aW9uc1dvcmtlcigpXHJcbiAgICB0aGlzLmRpc2tzU3RhdHNXb3JrZXIoKVxyXG4gICAgdGhpcy5uZXR3b3JrU3RhdHNXb3JrZXIoKVxyXG5cclxuICAgIHRoaXMuY3B1U3RhdHNXb3JrZXIoKVxyXG4gICAgdGhpcy5mZFN0YXRzV29ya2VyKClcclxuXHJcbiAgICBzZXRJbnRlcnZhbCgoKSA9PiB7XHJcbiAgICAgIGlmIChwcm9jZXNzLmNvbm5lY3RlZCA9PSBmYWxzZSkge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1N5c2luZm9zIG5vdCBjb25uZWN0ZWQsIGV4aXRpbmcnKVxyXG4gICAgICAgIHByb2Nlc3MuZXhpdCgpXHJcbiAgICAgIH1cclxuICAgICAgdHJ5IHtcclxuICAgICAgICBwcm9jZXNzLnNlbmQoSlNPTi5zdHJpbmdpZnkoeyBjbWQ6ICdwaW5nJyB9KSlcclxuICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1BNMiBpcyBkZWFkIHdoaWxlIGRvaW5nIHByb2Nlc3Muc2VuZCcpXHJcbiAgICAgICAgcHJvY2Vzcy5leGl0KClcclxuICAgICAgfVxyXG4gICAgICB0aGlzLnBpbmdfdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1BNMiBpcyBkZWFkIHdoaWxlIHdhaXRpbmcgZm9yIGEgcG9uZycpXHJcbiAgICAgICAgcHJvY2Vzcy5leGl0KClcclxuICAgICAgfSwgMjAwMClcclxuICAgIH0sIDMwMDApXHJcblxyXG4gICAgLy8gU3lzdGVtaW5mbyByZWNlaXZlIGNvbW1hbmRcclxuICAgIHByb2Nlc3Mub24oJ21lc3NhZ2UnLCAoY21kKSA9PiB7XHJcbiAgICAgIGlmIChjbWQgPT0gJ3F1ZXJ5Jykge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICB2YXIgcmVzID0gSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgICAgICBjbWQ6ICdxdWVyeTpyZXMnLFxyXG4gICAgICAgICAgICBkYXRhOiB0aGlzLnJlcG9ydCgpXHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgICAgcHJvY2Vzcy5zZW5kKHJlcylcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdDb3VsZCBub3QgcmV0cmlldmUgc3lzdGVtIGluZm9ybWF0aW9ucycsIGUpXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKGNtZCA9PSAncG9uZycpIHtcclxuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5waW5nX3RpbWVvdXQpXHJcbiAgICAgIH1cclxuICAgIH0pXHJcblxyXG4gIH1cclxuXHJcbiAgc3RhdGljSW5mb3JtYXRpb25zKCkge1xyXG4gICAgdmFyIGdldENQVSA9ICgpID0+IHtcclxuICAgICAgcmV0dXJuIHN5c2luZm8uY3B1KClcclxuICAgICAgICAudGhlbihkYXRhID0+IHtcclxuICAgICAgICAgIHRoaXMuaW5mb3MuY3B1ID0ge1xyXG4gICAgICAgICAgICBicmFuZDogZGF0YS5tYW51ZmFjdHVyZXIsXHJcbiAgICAgICAgICAgIG1vZGVsOiBkYXRhLmJyYW5kLFxyXG4gICAgICAgICAgICBzcGVlZDogZGF0YS5zcGVlZG1heCxcclxuICAgICAgICAgICAgY29yZXM6IGRhdGEuY29yZXMsXHJcbiAgICAgICAgICAgIHBoeXNpY2FsQ29yZXM6IGRhdGEucGh5c2ljYWxDb3Jlc1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGdldEJhc2Vib2FyZCA9ICgpID0+IHtcclxuICAgICAgcmV0dXJuIHN5c2luZm8uc3lzdGVtKClcclxuICAgICAgICAudGhlbihkYXRhID0+IHtcclxuICAgICAgICAgIHRoaXMuaW5mb3MuYmFzZWJvYXJkID0ge1xyXG4gICAgICAgICAgICBtYW51ZmFjdHVyZXI6IGRhdGEubWFudWZhY3R1cmVyLFxyXG4gICAgICAgICAgICBtb2RlbDogZGF0YS5tb2RlbCxcclxuICAgICAgICAgICAgdmVyc2lvbjogZGF0YS52ZXJzaW9uXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICB2YXIgZ2V0T3NJbmZvID0gKCkgPT4ge1xyXG4gICAgICByZXR1cm4gc3lzaW5mby5vc0luZm8oKVxyXG4gICAgICAgIC50aGVuKGRhdGEgPT4ge1xyXG4gICAgICAgICAgdGhpcy5pbmZvcy5vcyA9IHtcclxuICAgICAgICAgICAgcGxhdGZvcm06IGRhdGEucGxhdGZvcm0sXHJcbiAgICAgICAgICAgIGRpc3RybzogZGF0YS5kaXN0cm8sXHJcbiAgICAgICAgICAgIHJlbGVhc2U6IGRhdGEucmVsZWFzZSxcclxuICAgICAgICAgICAgY29kZW5hbWU6IGRhdGEuY29kZW5hbWUsXHJcbiAgICAgICAgICAgIGtlcm5lbDogZGF0YS5rZXJuZWwsXHJcbiAgICAgICAgICAgIGFyY2g6IGRhdGEuYXJjaFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGRpc2tMYXlvdXQgPSAoKSA9PiB7XHJcbiAgICAgIHRoaXMuaW5mb3Muc3RvcmFnZS5waHlzaWNhbF9kaXNrcyA9IFtdXHJcblxyXG4gICAgICByZXR1cm4gc3lzaW5mby5kaXNrTGF5b3V0KClcclxuICAgICAgICAudGhlbihkaXNrcyA9PiB7XHJcbiAgICAgICAgICBkaXNrcy5mb3JFYWNoKChkaXNrKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuaW5mb3Muc3RvcmFnZS5waHlzaWNhbF9kaXNrcy5wdXNoKHtcclxuICAgICAgICAgICAgICBkZXZpY2U6IGRpc2suZGV2aWNlLFxyXG4gICAgICAgICAgICAgIHR5cGU6IGRpc2sudHlwZSxcclxuICAgICAgICAgICAgICBuYW1lOiBkaXNrLm5hbWUsXHJcbiAgICAgICAgICAgICAgaW50ZXJmYWNlVHlwZTogZGlzay5pbnRlcmZhY2VUeXBlLFxyXG4gICAgICAgICAgICAgIHZlbmRvcjogZGlzay52ZW5kb3JcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICBnZXRCYXNlYm9hcmQoKVxyXG4gICAgICAudGhlbihnZXRDUFUpXHJcbiAgICAgIC50aGVuKGdldE9zSW5mbylcclxuICAgICAgLnRoZW4oZGlza0xheW91dClcclxuICAgICAgLmNhdGNoKGUgPT4ge1xyXG4gICAgICAgIGRlYnVnKGBFcnJvciB3aGVuIHRyeWluZyB0byByZXRyaWV2ZSBzdGF0aWMgaW5mb3JtYXRpb25zYCwgZSlcclxuICAgICAgfSlcclxuICB9XHJcblxyXG4gIGRvY2tlclN1bW1hcnkoY2IgPSAoKSA9PiB7IH0pIHtcclxuICAgIHN5c2luZm8uZG9ja2VyQ29udGFpbmVycyh0cnVlKVxyXG4gICAgICAudGhlbihjb250YWluZXJzID0+IHtcclxuICAgICAgICB2YXIgbm9uX2V4aXRlZF9jb250YWluZXJzID0gY29udGFpbmVycy5maWx0ZXIoY29udGFpbmVyID0+IGNvbnRhaW5lci5zdGF0ZSAhPSAnZXhpdGVkJylcclxuICAgICAgICB2YXIgbmV3X2NvbnRhaW5lcnMgPSBbXVxyXG5cclxuICAgICAgICBhc3luYy5mb3JFYWNoKG5vbl9leGl0ZWRfY29udGFpbmVycywgKGNvbnRhaW5lciwgbmV4dCkgPT4ge1xyXG4gICAgICAgICAgc3lzaW5mby5kb2NrZXJDb250YWluZXJTdGF0cyhjb250YWluZXIuaWQpXHJcbiAgICAgICAgICAgIC50aGVuKChzdGF0czogYW55W10pID0+IHtcclxuICAgICAgICAgICAgICB2YXIgbWV0YSA9IGNvbnRhaW5lclxyXG5cclxuICAgICAgICAgICAgICBzdGF0c1swXS5jcHVfcGVyY2VudCA9IChzdGF0c1swXS5jcHVfcGVyY2VudCkudG9GaXhlZCgxKVxyXG4gICAgICAgICAgICAgIHN0YXRzWzBdLm1lbV9wZXJjZW50ID0gKHN0YXRzWzBdLm1lbV9wZXJjZW50KS50b0ZpeGVkKDEpXHJcbiAgICAgICAgICAgICAgc3RhdHNbMF0ubmV0SU8udHggPSAoc3RhdHNbMF0ubmV0SU8udHggLyBERUZBVUxUX0NPTlZFUlNJT04pLnRvRml4ZWQoMSlcclxuICAgICAgICAgICAgICBzdGF0c1swXS5uZXRJTy5yeCA9IChzdGF0c1swXS5uZXRJTy5yeCAvIERFRkFVTFRfQ09OVkVSU0lPTikudG9GaXhlZCgxKVxyXG5cclxuICAgICAgICAgICAgICBzdGF0c1swXS5ibG9ja0lPLncgPSAoc3RhdHNbMF0uYmxvY2tJTy53IC8gREVGQVVMVF9DT05WRVJTSU9OKS50b0ZpeGVkKDEpXHJcbiAgICAgICAgICAgICAgc3RhdHNbMF0uYmxvY2tJTy5yID0gKHN0YXRzWzBdLmJsb2NrSU8uciAvIERFRkFVTFRfQ09OVkVSU0lPTikudG9GaXhlZCgxKVxyXG5cclxuICAgICAgICAgICAgICBtZXRhLnN0YXRzID0gQXJyYXkuaXNBcnJheShzdGF0cykgPT0gdHJ1ZSA/IHN0YXRzWzBdIDogbnVsbFxyXG4gICAgICAgICAgICAgIG5ld19jb250YWluZXJzLnB1c2gobWV0YSlcclxuICAgICAgICAgICAgICBuZXh0KClcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLmNhdGNoKGUgPT4ge1xyXG4gICAgICAgICAgICAgIGRlYnVnKGUpXHJcbiAgICAgICAgICAgICAgbmV4dCgpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSwgKGVycikgPT4ge1xyXG4gICAgICAgICAgaWYgKGVycilcclxuICAgICAgICAgICAgZGVidWcoZXJyKVxyXG4gICAgICAgICAgdGhpcy5pbmZvcy5jb250YWluZXJzID0gbmV3X2NvbnRhaW5lcnMuc29ydCgoYSwgYikgPT4ge1xyXG4gICAgICAgICAgICB2YXIgdGV4dEEgPSBhLm5hbWUudG9VcHBlckNhc2UoKTtcclxuICAgICAgICAgICAgdmFyIHRleHRCID0gYi5uYW1lLnRvVXBwZXJDYXNlKCk7XHJcbiAgICAgICAgICAgIHJldHVybiAodGV4dEEgPCB0ZXh0QikgPyAtMSA6ICh0ZXh0QSA+IHRleHRCKSA/IDEgOiAwO1xyXG4gICAgICAgICAgfSlcclxuICAgICAgICAgIHJldHVybiBjYigpXHJcbiAgICAgICAgfSlcclxuICAgICAgfSlcclxuICAgICAgLmNhdGNoKGUgPT4ge1xyXG4gICAgICAgIGRlYnVnKGUpXHJcbiAgICAgICAgcmV0dXJuIGNiKClcclxuICAgICAgfSlcclxuICB9XHJcblxyXG4gIHNlcnZpY2VzU3VtbWFyeSgpIHtcclxuICAgIHN5c2luZm8uc2VydmljZXMoJyonKVxyXG4gICAgICAudGhlbihzZXJ2aWNlcyA9PiB7XHJcbiAgICAgICAgdGhpcy5pbmZvcy5zZXJ2aWNlcy5ydW5uaW5nID0gc2VydmljZXMuZmlsdGVyKHNlcnZpY2UgPT4gc2VydmljZS5ydW5uaW5nID09PSB0cnVlKVxyXG4gICAgICAgIHRoaXMuaW5mb3Muc2VydmljZXMuc3RvcHBlZCA9IHNlcnZpY2VzLmZpbHRlcihzZXJ2aWNlID0+IHNlcnZpY2UucnVubmluZyA9PT0gZmFsc2UpXHJcbiAgICAgIH0pXHJcbiAgICAgIC5jYXRjaChlID0+IHtcclxuICAgICAgICBkZWJ1ZyhlKVxyXG4gICAgICB9KVxyXG4gIH1cclxuXHJcbiAgcHJvY2Vzc2VzU3VtbWFyeShjYikge1xyXG4gICAgcHNMaXN0KClcclxuICAgICAgLnRoZW4ocHJvY2Vzc2VzID0+IHtcclxuICAgICAgICB0aGlzLmluZm9zLnByb2Nlc3Nlcy5jcHVfc29ydGVkID0gcHJvY2Vzc2VzXHJcbiAgICAgICAgICAuZmlsdGVyKChhOiBhbnkpID0+ICEoYS5jbWQuaW5jbHVkZXMoJ1N5c3RlbUluZm8nKSAmJiBhLmNtZC5pbmNsdWRlcygnUE0yJykpKVxyXG4gICAgICAgICAgLnNvcnQoKGE6IGFueSwgYjogYW55KSA9PiBiLmNwdSAtIGEuY3B1KS5zbGljZSgwLCA1KVxyXG4gICAgICAgIHRoaXMuaW5mb3MucHJvY2Vzc2VzLm1lbV9zb3J0ZWQgPSBwcm9jZXNzZXNcclxuICAgICAgICAgIC5maWx0ZXIoKGE6IGFueSkgPT4gIShhLmNtZC5pbmNsdWRlcygnU3lzdGVtSW5mbycpICYmIGEuY21kLmluY2x1ZGVzKCdQTTInKSkpXHJcbiAgICAgICAgICAuc29ydCgoYTogYW55LCBiOiBhbnkpID0+IGIubWVtb3J5IC0gYS5tZW1vcnkpLnNsaWNlKDAsIDUpXHJcbiAgICAgICAgcmV0dXJuIGNiKClcclxuICAgICAgfSlcclxuICAgICAgLmNhdGNoKGUgPT4ge1xyXG4gICAgICAgIGRlYnVnKGBFcnJvciB3aGVuIHJldHJpZXZpbmcgcHJvY2VzcyBsaXN0YCwgZSlcclxuICAgICAgICByZXR1cm4gY2IoKVxyXG4gICAgICB9KVxyXG4gIH1cclxuXHJcbiAgY3B1U3RhdHNXb3JrZXIoKSB7XHJcbiAgICB2YXIgY3B1VGVtcENvbGxlY3Rpb25cclxuXHJcbiAgICAoY3B1VGVtcENvbGxlY3Rpb24gPSAoKSA9PiB7XHJcbiAgICAgIHN5c2luZm8uY3B1VGVtcGVyYXR1cmUoKVxyXG4gICAgICAgIC50aGVuKGRhdGEgPT4ge1xyXG4gICAgICAgICAgdGhpcy5pbmZvcy5jcHUudGVtcGVyYXR1cmUgPSBkYXRhLm1haW5cclxuICAgICAgICAgIHNldFRpbWVvdXQoY3B1VGVtcENvbGxlY3Rpb24uYmluZCh0aGlzKSwgMjAwMClcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaChlID0+IHtcclxuICAgICAgICAgIHNldFRpbWVvdXQoY3B1VGVtcENvbGxlY3Rpb24uYmluZCh0aGlzKSwgMjAwMClcclxuICAgICAgICB9KVxyXG4gICAgfSkoKVxyXG5cclxuICAgIGZ1bmN0aW9uIGZldGNoKCkge1xyXG4gICAgICBjb25zdCBzdGFydE1lYXN1cmUgPSBjb21wdXRlVXNhZ2UoKVxyXG5cclxuICAgICAgc2V0VGltZW91dChfID0+IHtcclxuICAgICAgICB2YXIgZW5kTWVhc3VyZSA9IGNvbXB1dGVVc2FnZSgpXHJcblxyXG4gICAgICAgIHZhciBpZGxlRGlmZmVyZW5jZSA9IGVuZE1lYXN1cmUuaWRsZSAtIHN0YXJ0TWVhc3VyZS5pZGxlXHJcbiAgICAgICAgdmFyIHRvdGFsRGlmZmVyZW5jZSA9IGVuZE1lYXN1cmUudG90YWwgLSBzdGFydE1lYXN1cmUudG90YWxcclxuXHJcbiAgICAgICAgdmFyIHBlcmNlbnRhZ2VDUFUgPSAoMTAwMDAgLSBNYXRoLnJvdW5kKDEwMDAwICogaWRsZURpZmZlcmVuY2UgLyB0b3RhbERpZmZlcmVuY2UpKSAvIDEwMFxyXG4gICAgICAgIHRoaXMuaW5mb3MuY3B1LnVzYWdlID0gKHBlcmNlbnRhZ2VDUFUpLnRvRml4ZWQoMSlcclxuICAgICAgfSwgMTAwKVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGNvbXB1dGVVc2FnZSgpIHtcclxuICAgICAgbGV0IHRvdGFsSWRsZSA9IDBcclxuICAgICAgbGV0IHRvdGFsVGljayA9IDBcclxuICAgICAgY29uc3QgY3B1cyA9IG9zLmNwdXMoKVxyXG5cclxuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGNwdXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuICAgICAgICB2YXIgY3B1ID0gY3B1c1tpXVxyXG4gICAgICAgIGZvciAobGV0IHR5cGUgaW4gY3B1LnRpbWVzKSB7XHJcbiAgICAgICAgICB0b3RhbFRpY2sgKz0gY3B1LnRpbWVzW3R5cGVdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRvdGFsSWRsZSArPSBjcHUudGltZXMuaWRsZVxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIGlkbGU6IHBhcnNlSW50KCh0b3RhbElkbGUgLyBjcHVzLmxlbmd0aCkgKyBcIlwiKSxcclxuICAgICAgICB0b3RhbDogcGFyc2VJbnQoKHRvdGFsVGljayAvIGNwdXMubGVuZ3RoKSArIFwiXCIpXHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzZXRJbnRlcnZhbChmZXRjaC5iaW5kKHRoaXMpLCAxMDAwKVxyXG4gICAgZmV0Y2guYmluZCh0aGlzKSgpXHJcbiAgfVxyXG5cclxuICBtZW1TdGF0cyhjYikge1xyXG4gICAgc3lzaW5mby5tZW0oKVxyXG4gICAgICAudGhlbihkYXRhID0+IHtcclxuICAgICAgICB0aGlzLmluZm9zLm1lbS50b3RhbCA9IChkYXRhLnRvdGFsIC8gREVGQVVMVF9DT05WRVJTSU9OKS50b0ZpeGVkKDIpXHJcbiAgICAgICAgdGhpcy5pbmZvcy5tZW0uZnJlZSA9IChkYXRhLmZyZWUgLyBERUZBVUxUX0NPTlZFUlNJT04pLnRvRml4ZWQoMilcclxuICAgICAgICB0aGlzLmluZm9zLm1lbS5hY3RpdmUgPSAoZGF0YS5hY3RpdmUgLyBERUZBVUxUX0NPTlZFUlNJT04pLnRvRml4ZWQoMilcclxuICAgICAgICB0aGlzLmluZm9zLm1lbS5hdmFpbGFibGUgPSAoZGF0YS5hdmFpbGFibGUgLyBERUZBVUxUX0NPTlZFUlNJT04pLnRvRml4ZWQoMilcclxuICAgICAgICByZXR1cm4gY2IoKVxyXG4gICAgICB9KVxyXG4gICAgICAuY2F0Y2goZSA9PiB7XHJcbiAgICAgICAgZGVidWcoYEVycm9yIHdoaWxlIGdldHRpbmcgbWVtb3J5IGluZm9gLCBlKVxyXG4gICAgICAgIHJldHVybiBjYigpXHJcbiAgICAgIH0pXHJcbiAgfVxyXG5cclxuICBuZXR3b3JrQ29ubmVjdGlvbnNXb3JrZXIoKSB7XHJcbiAgICB2YXIgcmV0cmlldmVDb25uXHJcblxyXG4gICAgKHJldHJpZXZlQ29ubiA9ICgpID0+IHtcclxuICAgICAgc3lzaW5mby5uZXR3b3JrQ29ubmVjdGlvbnMoKVxyXG4gICAgICAgIC50aGVuKGNvbm5zID0+IHtcclxuICAgICAgICAgIHRoaXMuaW5mb3MuY29ubmVjdGlvbnMgPSBjb25uc1xyXG4gICAgICAgICAgICAuZmlsdGVyKGNvbm4gPT4gY29ubi5sb2NhbHBvcnQgIT0gJzQ0MycgJiYgY29ubi5wZWVycG9ydCAhPSAnNDQzJylcclxuICAgICAgICAgICAgLm1hcCgoY29ubjogYW55KSA9PiBgJHtjb25uLmxvY2FsYWRkcmVzc306JHtjb25uLmxvY2FscG9ydH0tJHtjb25uLnBlZXJhZGRyZXNzfToke2Nvbm4ucGVlcnBvcnR9LSR7Y29ubi5wcm9jID8gY29ubi5wcm9jIDogJ3Vua25vd24nfWApXHJcbiAgICAgICAgICBzZXRUaW1lb3V0KHJldHJpZXZlQ29ubi5iaW5kKHRoaXMpLCAxMCAqIDEwMDApXHJcbiAgICAgICAgfSlcclxuICAgICAgICAuY2F0Y2goZSA9PiB7XHJcbiAgICAgICAgICBkZWJ1ZyhgRXJyb3Igd2hpbGUgcmV0cmlldmluZyBmaWxlc3lzdGVtIGluZm9zYCwgZSlcclxuICAgICAgICAgIHNldFRpbWVvdXQocmV0cmlldmVDb25uLmJpbmQodGhpcyksIDEwICogMTAwMClcclxuICAgICAgICB9KVxyXG4gICAgfSkoKTtcclxuICB9XHJcblxyXG4gIGRpc2tzU3RhdHNXb3JrZXIoKSB7XHJcbiAgICB2YXIgcnggPSAwXHJcbiAgICB2YXIgd3ggPSAwXHJcbiAgICB2YXIgc3RhcnRlZCA9IGZhbHNlXHJcbiAgICB2YXIgZnNTaXplQ29sbGVjdGlvbiwgaW9Db2xsZWN0aW9uXHJcblxyXG4gICAgKGZzU2l6ZUNvbGxlY3Rpb24gPSAoKSA9PiB7XHJcbiAgICAgIHN5c2luZm8uZnNTaXplKClcclxuICAgICAgICAudGhlbihmc3MgPT4ge1xyXG4gICAgICAgICAgdmFyIGZzZSA9IGZzcy5maWx0ZXIoZnMgPT4gKGZzLnNpemUgLyAoMTAyNCAqIDEwMjQpKSA+IDIwMClcclxuICAgICAgICAgIHRoaXMuaW5mb3Muc3RvcmFnZS5maWxlc3lzdGVtcyA9IGZzZVxyXG4gICAgICAgICAgc2V0VGltZW91dChmc1NpemVDb2xsZWN0aW9uLmJpbmQodGhpcyksIDMwICogMTAwMClcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaChlID0+IHtcclxuICAgICAgICAgIGRlYnVnKGBFcnJvciB3aGlsZSByZXRyaWV2aW5nIGZpbGVzeXN0ZW0gaW5mb3NgLCBlKVxyXG4gICAgICAgICAgc2V0VGltZW91dChmc1NpemVDb2xsZWN0aW9uLmJpbmQodGhpcyksIDEwICogMTAwMClcclxuICAgICAgICB9KVxyXG4gICAgfSkoKTtcclxuXHJcbiAgICAoaW9Db2xsZWN0aW9uID0gKCkgPT4ge1xyXG4gICAgICBzeXNpbmZvLmZzU3RhdHMoKVxyXG4gICAgICAgIC50aGVuKChmc19zdGF0czogYW55KSA9PiB7XHJcbiAgICAgICAgICB2YXIgbmV3X3J4ID0gZnNfc3RhdHMucnhcclxuICAgICAgICAgIHZhciBuZXdfd3ggPSBmc19zdGF0cy53eFxyXG5cclxuICAgICAgICAgIHZhciByZWFkID0gKChuZXdfcnggLSByeCkgLyBERUZBVUxUX0NPTlZFUlNJT04pLnRvRml4ZWQoMylcclxuICAgICAgICAgIHZhciB3cml0ZSA9ICgobmV3X3d4IC0gd3gpIC8gREVGQVVMVF9DT05WRVJTSU9OKS50b0ZpeGVkKDMpXHJcblxyXG4gICAgICAgICAgaWYgKHN0YXJ0ZWQgPT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICB0aGlzLmluZm9zLnN0b3JhZ2UuaW8ucmVhZC5hZGQocGFyc2VGbG9hdChyZWFkKSlcclxuICAgICAgICAgICAgdGhpcy5pbmZvcy5zdG9yYWdlLmlvLndyaXRlLmFkZChwYXJzZUZsb2F0KHdyaXRlKSlcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICByeCA9IG5ld19yeFxyXG4gICAgICAgICAgd3ggPSBuZXdfd3hcclxuICAgICAgICAgIHN0YXJ0ZWQgPSB0cnVlXHJcbiAgICAgICAgICBzZXRUaW1lb3V0KGlvQ29sbGVjdGlvbi5iaW5kKHRoaXMpLCAxMDAwKVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmNhdGNoKGUgPT4ge1xyXG4gICAgICAgICAgZGVidWcoYEVycm9yIHdoaWxlIGdldHRpbmcgbmV0d29yayBzdGF0aXN0aWNzYCwgZSlcclxuICAgICAgICAgIHNldFRpbWVvdXQoaW9Db2xsZWN0aW9uLmJpbmQodGhpcyksIDEwMDApXHJcbiAgICAgICAgfSlcclxuICAgIH0pKCk7XHJcbiAgfVxyXG5cclxuICBmZFN0YXRzV29ya2VyKCkge1xyXG4gICAgdmFyIGdldEZET3BlbmVkID0gKCkgPT4ge1xyXG4gICAgICBmcy5yZWFkRmlsZSgnL3Byb2Mvc3lzL2ZzL2ZpbGUtbnInLCAoZXJyLCBvdXQpID0+IHtcclxuICAgICAgICBpZiAoZXJyKSByZXR1cm5cclxuICAgICAgICBjb25zdCBvdXRwdXQgPSBvdXQudG9TdHJpbmcoKS50cmltKClcclxuICAgICAgICBjb25zdCBwYXJzZWQgPSBvdXRwdXQuc3BsaXQoJ1xcdCcpXHJcbiAgICAgICAgaWYgKHBhcnNlZC5sZW5ndGggIT09IDMpIHJldHVyblxyXG4gICAgICAgIHRoaXMuaW5mb3MuZmQub3BlbmVkID0gcGFyc2VJbnQocGFyc2VkWzBdKVxyXG4gICAgICAgIHRoaXMuaW5mb3MuZmQubWF4ID0gcGFyc2VJbnQocGFyc2VkWzJdKVxyXG4gICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIHNldEludGVydmFsKCgpID0+IHtcclxuICAgICAgZ2V0RkRPcGVuZWQoKVxyXG4gICAgfSwgMjAgKiAxMDAwKVxyXG5cclxuICAgIGdldEZET3BlbmVkKClcclxuICB9XHJcblxyXG4gIG5ldHdvcmtTdGF0c1dvcmtlcigpIHtcclxuICAgIHZhciBsYXRlbmN5Q29sbGVjdGlvbiwgbmV0d29ya1N0YXRzQ29sbGVjdGlvblxyXG5cclxuICAgIC8vIChsYXRlbmN5Q29sbGVjdGlvbiA9ICgpID0+IHtcclxuICAgIC8vICAgc3lzaW5mby5pbmV0TGF0ZW5jeSgpXHJcbiAgICAvLyAgICAgLnRoZW4obGF0ZW5jeSA9PiB7XHJcbiAgICAvLyAgICAgICB0aGlzLmluZm9zLm5ldHdvcmsubGF0ZW5jeS5hZGQobGF0ZW5jeSlcclxuICAgIC8vICAgICAgIHNldFRpbWVvdXQobGF0ZW5jeUNvbGxlY3Rpb24uYmluZCh0aGlzKSwgMjAwMClcclxuICAgIC8vICAgICB9KVxyXG4gICAgLy8gICAgIC5jYXRjaChlID0+IHtcclxuICAgIC8vICAgICAgIGRlYnVnKGUpXHJcbiAgICAvLyAgICAgICBzZXRUaW1lb3V0KGxhdGVuY3lDb2xsZWN0aW9uLmJpbmQodGhpcyksIDIwMDApXHJcbiAgICAvLyAgICAgfSlcclxuICAgIC8vIH0pKClcclxuXHJcbiAgICBzeXNpbmZvLm5ldHdvcmtJbnRlcmZhY2VEZWZhdWx0KChuZXRfaW50ZXJmYWNlKSA9PiB7XHJcbiAgICAgIHZhciBzdGFydGVkID0gZmFsc2VcclxuICAgICAgdmFyIHJ4ID0gMFxyXG4gICAgICB2YXIgdHggPSAwXHJcbiAgICAgIHZhciByeF9lID0gMFxyXG4gICAgICB2YXIgdHhfZSA9IDBcclxuICAgICAgdmFyIHJ4X2QgPSAwXHJcbiAgICAgIHZhciB0eF9kID0gMDtcclxuXHJcbiAgICAgIChuZXR3b3JrU3RhdHNDb2xsZWN0aW9uID0gKCkgPT4ge1xyXG4gICAgICAgIHN5c2luZm8ubmV0d29ya1N0YXRzKG5ldF9pbnRlcmZhY2UpXHJcbiAgICAgICAgICAudGhlbigobmV0KSA9PiB7XHJcbiAgICAgICAgICAgIHZhciBuZXdfcnggPSAobmV0WzBdLnJ4X2J5dGVzIC0gcngpIC8gREVGQVVMVF9DT05WRVJTSU9OXHJcbiAgICAgICAgICAgIHZhciBuZXdfdHggPSAobmV0WzBdLnR4X2J5dGVzIC0gdHgpIC8gREVGQVVMVF9DT05WRVJTSU9OXHJcbiAgICAgICAgICAgIHJ4ID0gbmV0WzBdLnJ4X2J5dGVzXHJcbiAgICAgICAgICAgIHR4ID0gbmV0WzBdLnR4X2J5dGVzXHJcblxyXG4gICAgICAgICAgICB2YXIgbmV3X3J4X2UgPSAobmV0WzBdLnJ4X2Vycm9ycyAtIHJ4X2UpIC8gREVGQVVMVF9DT05WRVJTSU9OXHJcbiAgICAgICAgICAgIHZhciBuZXdfdHhfZSA9IChuZXRbMF0udHhfZXJyb3JzIC0gdHhfZSkgLyBERUZBVUxUX0NPTlZFUlNJT05cclxuICAgICAgICAgICAgcnhfZSA9IG5ldFswXS5yeF9lcnJvcnNcclxuICAgICAgICAgICAgdHhfZSA9IG5ldFswXS50eF9lcnJvcnNcclxuXHJcbiAgICAgICAgICAgIHZhciBuZXdfcnhfZCA9IChuZXRbMF0ucnhfZHJvcHBlZCAtIHJ4X2QpIC8gREVGQVVMVF9DT05WRVJTSU9OXHJcbiAgICAgICAgICAgIHZhciBuZXdfdHhfZCA9IChuZXRbMF0udHhfZHJvcHBlZCAtIHR4X2QpIC8gREVGQVVMVF9DT05WRVJTSU9OXHJcbiAgICAgICAgICAgIHJ4X2QgPSBuZXRbMF0ucnhfZHJvcHBlZFxyXG4gICAgICAgICAgICB0eF9kID0gbmV0WzBdLnR4X2Ryb3BwZWRcclxuXHJcbiAgICAgICAgICAgIGlmIChzdGFydGVkID09IHRydWUpIHtcclxuICAgICAgICAgICAgICB0aGlzLmluZm9zLm5ldHdvcmsucnhfNS5hZGQobmV3X3J4KVxyXG4gICAgICAgICAgICAgIHRoaXMuaW5mb3MubmV0d29yay50eF81LmFkZChuZXdfdHgpXHJcbiAgICAgICAgICAgICAgdGhpcy5pbmZvcy5uZXR3b3JrLnJ4X2Vycm9yc182MC5hZGQobmV3X3J4X2UpXHJcbiAgICAgICAgICAgICAgdGhpcy5pbmZvcy5uZXR3b3JrLnR4X2Vycm9yc182MC5hZGQobmV3X3R4X2UpXHJcbiAgICAgICAgICAgICAgdGhpcy5pbmZvcy5uZXR3b3JrLnJ4X2Ryb3BwZWRfNjAuYWRkKG5ld19yeF9kKVxyXG4gICAgICAgICAgICAgIHRoaXMuaW5mb3MubmV0d29yay50eF9kcm9wcGVkXzYwLmFkZChuZXdfdHhfZClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBzdGFydGVkID0gdHJ1ZVxyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KG5ldHdvcmtTdGF0c0NvbGxlY3Rpb24uYmluZCh0aGlzKSwgMTAwMClcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgICAuY2F0Y2goZSA9PiB7XHJcbiAgICAgICAgICAgIGRlYnVnKGBFcnJvciBvbiByZXRyaWV2aW5nIG5ldHdvcmsgc3RhdHNgLCBlKVxyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KG5ldHdvcmtTdGF0c0NvbGxlY3Rpb24uYmluZCh0aGlzKSwgOTAwKVxyXG4gICAgICAgICAgfSlcclxuICAgICAgfSkoKVxyXG4gICAgfSlcclxuXHJcbiAgfVxyXG59XHJcblxyXG5pZiAocmVxdWlyZS5tYWluID09PSBtb2R1bGUpIHtcclxuICB2YXIgc3lzID0gbmV3IFN5c3RlbUluZm8oKVxyXG4gIHN5cy5zdGFydENvbGxlY3Rpb24oKVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBTeXN0ZW1JbmZvXHJcbiJdfQ==