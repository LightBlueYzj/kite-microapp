// TODO 设置页弹出动画、情侣课表页面、TODO、五天|七天、支持使用教务系统的密码、支持直接导入班级课表、用户未实名，跳转到实名认证页。
// TODO 由于不知道同步发送请求，使用嵌套的形式，设置了settimetable函数

import { handlerGohomeClick, handlerGobackClick } from "../../../utils/navBarUtils";
import getHeader from "../../../utils/getHeader";

const app = getApp();
const timeTableSuffix = "/edu/timetable";
const calendarSuffix = "/edu/calendar";
const scheduleSuffix = "/edu/schedule";
const requestUtils = require("../../../utils/requestUtils");
const timeUtils = require("../../../utils/timeUtils");
const transformationsUtils = require("../../../utils/transformationsUtils");
const discipline = require('./discipline')
// const QR = require("../../../utils/weapp-qrcode")

let date = []
let days = []
let page = 0
let page_day = 0
let timetableMode = 1
let course_data = []
let course_week = []
let tapSet = false
let choosedCouple = false
let this_week = 0
let startWeek 
let choosedday = []
let toschool 
let calendar = []
let code = false
let qrcodeWidth = 150
const quality = 1
let codeText = 'dwdwefewfw'
let table = []
let list = []
Page({
  data: {
    date, days, timetableMode, list, tapSet, page, this_week, startWeek, course_data, choosedday, discipline, page_day, toschool, code,qrcodeWidth,quality,codeText,choosedCouple,table,course_week,calendar
  },
  // 导航栏函数
  handlerGohomeClick,
  handlerGobackClick,

  setdata(e) {
    let _this = this
    let time
    let url_calendar = `${app.globalData.commonUrl}${calendarSuffix}`;
    let url_schedule = `${app.globalData.commonUrl}${scheduleSuffix}`;
    let header = getHeader("urlencoded", app.globalData.token);
    let data_calendar = {};
    let data_schedule = {};
    let schedule = requestUtils.doGET(url_schedule, data_schedule, header);
    schedule.then((res) => {
      data_schedule = res.data.data
      _this.setData({
        table : data_schedule
      })
      wx.setStorageSync('timetable_schedule', data_schedule)
    })
    let calendar = requestUtils.doGET(url_calendar, data_calendar, header);
    calendar.then((res) => {
      data_calendar = res.data.data
      data_calendar.start = data_calendar.start.replace(/-/g, '/')
      _this.setData({
        calendar: data_calendar,
        toschool : data_calendar.start
      })
      let year = data_calendar.year;
      let semester = data_calendar.semester;
      if(Date.parse(new Date())<Date.parse(_this.data.toschool)){time=_this.data.toschool}else{time=new Date()} 
      _this.time(data_calendar.start,time); 
      _this.setTimetable(year,semester,header)
      wx.setStorageSync('timetable_calendar', data_calendar)
    })
  },

  setTimetable(year,semester,header) {
    let _this = this;
    let Data;
    let Week;
    let data_timetable = {};
    let url_timetable = `${app.globalData.commonUrl}${timeTableSuffix}?year=${year}&semester=${semester}`;
    let timeTable = requestUtils.doGET(url_timetable, data_timetable, header);
    timeTable.then((res) => {
      data_timetable = res.data.data.timeTable
      _this.setData({
        list: data_timetable
      })
      Data = _this.binary(data_timetable, _this.data.this_week, _this.data.choosedday);
      Week = _this.binaryWeek(data_timetable, _this.data.this_week);
      _this.setData({      
        course_data:Data,
        course_week:Week})
      wx.setStorageSync('timetable_list', data_timetable)
    })
  },

  time (schoolholidaydirectory, giventime) {
    let _this = this
    let date = _this.data.date
    schoolholidaydirectory = Date.parse(new Date(schoolholidaydirectory))-86400000; 
    giventime = Date.parse(new Date(giventime));
    let this_week = timeUtils.getIntervalToCurrentWeek(schoolholidaydirectory, giventime);
    if (_this.data.startWeek == undefined) { _this.data.startWeek = this_week }
    date = timeUtils.getTimeOfWeek(giventime);
    date.map(el => {
      switch(el.week){
        case 0 : el.weeks = '日';el.week=7;break;
        case 1 : el.weeks = '一';break;
        case 2 : el.weeks = '二';break;
        case 3 : el.weeks = '三';break;
        case 4 : el.weeks = '四';break;
        case 5 : el.weeks = '五';break;
        case 6 : el.weeks = '六';break;
      }
      return el;
    })
    let nowdate = new Date();
    nowdate = nowdate.getDay() !=0|| 7;
    if (_this.data.choosedday.length == []) {_this.data.choosedday.week = nowdate}
    else if (_this.data.choosedday.week == 1) {nowdate = 1}
    else if (_this.data.choosedday.week == 0) {nowdate = 7}
    if(_this.data.choosedday != undefined){
      nowdate = _this.data.choosedday.week; 
      if (_this.data.choosedday.week == 0) {nowdate = 7}} 
    _this.setData({
      date: date,
      days: _this.data.days,
      choosedday: { week: nowdate },
      this_week: this_week,
      startWeek: _this.data.startWeek
    })
  },

  table (e) {
    let _this = this;
    let table = _this.data.table
    let y = 0
    for(var j =0;j<e.length;j++) {
      for(var i = 0; i < e[j].table.length; i++) {
        if(e[j].table[i]===1&&y==0){
          e[j].tables=[]
          table[e[j].campus][e[j].place.substring(0,2)] != undefined ? e[j].tables[0]=table[e[j].campus][e[j].place.substring(0,2)][i][0] : e[j].tables[0]=table[e[j].campus]["default"][i][0];
          y=1;
        }else if(e[j].table[i]===0&&y==1){
          table[e[j].campus][e[j].place.substring(0,2)] != undefined ? e[j].tables[1]=table[e[j].campus][e[j].place.substring(0,2)][i-1][1] : e[j].tables[1]=table[e[j].campus]["default"][i-1][1];
          y=0;
        }
      }
    }
    let textlist = e
    return textlist;
  },

  changeTime (starttime, giventime) {
    let _this = this
    let nowtime
    let startWeek = _this.data.startWeek
    _this.data.this_week = giventime;
    if(Date.parse(new Date())<Date.parse(_this.data.toschool)){nowtime=_this.data.toschool}else{nowtime=new Date()} 
    let time = Date.parse(nowtime) + (giventime - startWeek) * 604800000 
    time = new Date(time)
    _this.time(starttime, time);
  },

  readData(){
    let _this = this;
    _this.data.list = wx.getStorageSync('timetable_list');
    _this.data.table = wx.getStorageSync('timetable_schedule');
    _this.data.calendar = wx.getStorageSync('timetable_calendar');
    _this.data.toschool =     _this.data.calendar.start
    if (wx.getStorageSync('timetableMode') == 0) {
    wx.setStorageSync('timetableMode',1)}
    _this.data.timetableMode = wx.getStorageSync('timetableMode');
  },

  certification(){ 
    app.globalData.identity 
    ? '' 
    :wx.showModal({ 
      showCancel: false, 
      content: '需要实名认证哦', 
      complete: () => { 
        wx.navigateTo({ url: '/pages/verify/verify' })} 
    }); 
  }, 
 
  onLoad (options) {
    let _this = this
    let course_data
    let time 
    let course_week
    _this.readData();
    _this.certification(); 
    if(app.globalData.identity!=undefined){ 
    if (_this.data.list.length == 0 || _this.data.calendar.length == 0 || _this.data.table.length == 0) {
      _this.setdata();
    } else {
      if(Date.parse(new Date())<Date.parse(_this.data.toschool)){time=_this.data.toschool}else{time=new Date()} 
      _this.time(_this.data.toschool,time); 
      course_data = _this.binary(_this.data.list, _this.data.this_week, _this.data.choosedday);
      course_week = _this.binaryWeek(_this.data.list, _this.data.this_week);
    }
    _this.setData({
      list: _this.data.list,
      course_data: course_data,
      table: _this.data.table,
      toschool: _this.data.toschool,
      course_week:course_week,
      timetableMode: _this.data.timetableMode});
    }
  },

  binaryWeek(list,this_week) {
  let newlist = [];
  newlist = list.filter(el => el.weeks[this_week - 1] == '1')
  for (let i = 0; i < newlist.length; i++) {
    let section = 0
    let time = 0
    for (let x = 0; x < newlist[i].table.length; x++) {
      if (newlist[i].table[x] == 1 && time == 0) {
        section = x + 1
        time++
      } else if (newlist[i].table[x] == 1) {
        time++
      };
      let color = i % 9
      newlist[i].colorArrays = color
      newlist[i].section = section;
      newlist[i].time = time;
    }
  }
  let result = newlist
  return result
  },

  binary (list, this_week, day) {
    let discipline = this.data.discipline.discipline
    let newlist = []
    let textlist = []
      list.map(el => {
        el.weeks = transformationsUtils.transformations(el.week, 32)
        el.table = transformationsUtils.transformations(el.timeIndex,32)
      })
    newlist = list.filter(el => el.weeks[this_week - 1] == "1")
    textlist = newlist.filter(el => el.day == day.week)
    textlist.sort((a, b) => a.time_index - b.time_index)
    for (let i = 0; i < textlist.length; i++) {
      for (let j = 0; j < discipline.length; j++) {
        if (textlist[i].courseName === discipline[j].subject) {
          textlist[i].discipline = discipline[j].discipline}
        }
        if (!textlist[i].discipline) {
          textlist[i].discipline = "generality"
        }
    }
    let result = this.table(textlist)
    return result
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  // onReady: function () {
  //   var imgData = QR.drawImg(this.data.codeText, {
  //     typeNumber: 4,
  //     errorCorrectLevel: 'M',
  //     size: 500
  //   })
  //   this.setData({
  //     QRCode: imgData
  //   })
  // },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow () {
    let _this = this 
    if(app.globalData.identity!=undefined){ 
    if (_this.data.list.length == 0 || _this.data.calendar.length == 0 || _this.data.table.length == 0) { 
      _this.setdata(); 
    } 
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage () {

  },

  tapDays (e) {
    let _this = this;
    let date = e.currentTarget.dataset.days.week;
    this.data.choosedday.week = date
    this.setData({ choosedday: { week: date } })
    let course_data = _this.binary(_this.data.list, _this.data.this_week, _this.data.choosedday);
    _this.setData({ list: _this.data.list, course_data: course_data });
  },

  tapActivity (e) {
    let _this = this;
    let timetableMode = _this.data.timetableMode;
    timetableMode ==1? timetableMode=2:timetableMode=1 
    _this.setData({timetableMode: timetableMode})
    wx.setStorage({
      key: 'timetableMode',
      data: timetableMode,
    })
  },
  tapSet (e) {
    let _this = this;
    let tapSet = _this.data.tapSet
    tapSet =!tapSet;  
    _this.setData({ tapSet: tapSet });
  },
  sliderchange (e) {
    let _this = this;
    let sliderChange = e.detail.value
    _this.changeTime(_this.data.toschool, sliderChange);
    let course_data = _this.binary(_this.data.list, _this.data.this_week, _this.data.choosedday);
    let course_week = _this.binaryWeek(_this.data.list, _this.data.this_week);
    _this.setData({ list: _this.data.list, course_data: course_data ,course_week:course_week});
  },
  bindchange(e) {
    let index = e.detail.current;
    let _this = this;
    let page = _this.data.page
    let this_week = _this.data.this_week
    switch(index){
      case 1 : page == 0 ? this_week++:this_week--;break;
      case 2 : page == 1 ? this_week++:this_week--;break;
      case 0 : page == 2 ? this_week++:this_week--;break;
    }
    page = index;
    if (this_week <= 0) {this_week = 1}
    this.setData({
      navState: index,
      page,
      this_week:this_week
    })
    _this.changeTime(_this.data.toschool, this_week)
    let course_data = _this.binary(_this.data.list, _this.data.this_week, _this.data.choosedday);
    let course_week = _this.binaryWeek(_this.data.list, _this.data.this_week);
    _this.setData({ list: _this.data.list, course_data,course_week });
  },

  bindchangeday(e) {
    let index = e.detail.current;
    let _this = this;
    let page_day = _this.data.page_day;
    let this_day = _this.data.choosedday.week
    switch(index){
      case 1 : page_day == 0 ? this_day++:this_day--;break;
      case 2 : page_day == 1 ? this_day++:this_day--;break;
      case 0 : page_day == 2 ? this_day++:this_day--;break;
    }
    page_day = index
    _this.data.choosedday.week = this_day;
    _this.setData({ choosedday: _this.data.choosedday })
    if (_this.data.choosedday.week == 8) {
      _this.data.choosedday.week = 1;
      _this.data.this_week++;
      _this.changeTime(_this.data.toschool, _this.data.this_week)
    }
    if (_this.data.choosedday.week == 0) {
      _this.data.this_week--;
      if (_this.data.this_week == 0) {_this.data.this_week = 1}
      _this.changeTime(_this.data.toschool, _this.data.this_week)
    }
    let course_data = _this.binary(_this.data.list, _this.data.this_week, _this.data.choosedday);
    this.setData({
      navState_day: index,
      page_day,
      choosedday: _this.data.choosedday,
      ist: _this.data.list,
      course_data
    })
  },

  scanCode (e) {
    wx.scanCode({
      success(res) {
        console.log(res.result)
      }
    })
  },
  code (e) {
    this.data.choosedCouple = !this.data.choosedCouple
    this.setData(choosedCouple)
  },
  collapse() {
    if (this.data.tapSet === true) {
      this.setData({ tapSet: false });
    }
  }
})
