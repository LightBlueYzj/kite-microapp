// 我
// pages/user/user.js

import onShareAppMessage from "../../utils/onShareAppMessage";
import request   from "../../utils/request";
import getHeader from "../../utils/getHeader";
import promisify from "../../utils/promisify";
import loading   from "../../utils/loading";

const app = getApp();
const gData = app.globalData;

const catchError = (prefix, msg, err) => {
  console.error(`${prefix} ${msg}`, err);
  wx.showModal({
    title: msg,
    content: `${msg}，请检查网络或稍后再试。${
      err.symbol === request.symbols.codeNotZero &&
      typeof err.res.msg === "string"
        ? "\n错误信息：" + err.res.msg
        : ""
    }`,
    showCancel: false
  });
}

let wxCode = "";

Page({

  data: {
    isLogin: gData.isLogin,
    verified: gData.verified,
    needRegister: false
  },

  onShareAppMessage,

  // setDataTo(target: [boolean, boolean, boolean], data)
  // 按需向页面变量 this.data、全局变量 globalData 和本地缓存 Storage 设置变量
  setDataTo(target, data) {
    target[0] && this.setData(data);
    target[1] && Object.assign(gData, data);
    target[2] && Object.entries(data).forEach(
      ([key, value]) => wx.setStorageSync(key, value)
    );
  },

  // 向全局变量 globalData 和本地缓存 Storage 设置 uid、token、nickName 和 avatarUrl
  setUserData(data, token) { // token 不一定在 data 对象内，故单独设置参数获取
    const { uid, nickName, avatar: avatarUrl } = data;
    this.setDataTo([0, 1, 1], { uid, token, nickName, avatarUrl });
  },

  // 从服务器端 GET user identity，并设置变量 verified 和 identity
  setIdentity() {
    // GET user identity
    request({
      url: `${gData.apiUrl}/user/${gData.uid}/identity`,
      header: getHeader("urlencoded", gData.token)
    }).then(
      res => {
        this.setDataTo([0, 1, 1], { identity: res.data.data });
        this.setDataTo([1, 1, 1], { verified: true });
      }
    ).catch(
      err => console.error("GET user identity 失败", err)
    );
  },

  // 向页面变量 this.data 和全局变量 globalData 设置 isLogin
  setIsLogin() {
    this.setDataTo([1, 1, 0], { isLogin: true });
  },

  login() {
    // https://github.com/SIT-Yiban/kite-server/blob/master/docs/APIv1/用户模块.md

    promisify(wx.login)().then(res => {

      wxCode = res.code;

      loading({

        title: "正在登录…",

        callback: request({
          url: `${gData.apiUrl}/session`,
          method: "POST",
          header: getHeader("urlencoded"),
          data: { loginType: 0, wxCode }
        }).then(res => {

          console.log("POST session 登录成功", res);

          // res: { data: { code, data: { token, data: { uid, ... } } } }
          const data = res.data.data;

          // setIdentity() 会用到 setUserData() 向全局变量 globalData 设置的
          // uid 和 token，所以必须先执行 setUserData()，再执行 setIdentity()；
          // setIsLogin() 会显示用户元素，setIdentity() 会设置被显示的用户元素
          // 中的“已/未实名”，所以最好先执行 setIdentity()，再执行 setIsLogin()。
          this.setUserData(data.data, data.token);
          this.setIdentity();
          this.setIsLogin();

        }).catch(err => {

          // 判断是用户不存在，还是出错了
          if (
            err.symbol === request.symbols.codeNotZero &&
            err.res.data.code === 51
          ) {
            // 用户不存在，准备请求授权并注册用户
            this.setData({ needRegister: true });
            wx.showModal({
              title: "需要授权",
              content: "请再次点击按钮进行授权。",
              confirmText: "好的",
              showCancel: false
            });
          } else {
            // 出错了
            catchError("POST session", "登录失败", err);
          }

        })

      })

    }).catch(
      error => {
        console.error("微信登录失败", error);
        wx.showModal({
          title: "微信登录失败",
          content: "微信登录失败，请检查网络或稍后重试。",
          showCancel: false
        });
      }
    );

  },

  // 获取微信用户信息
  register() {

    wx.getUserProfile({
      lang: "zh_CN",
      desc: "上应小风筝需要获得您的公开信息" // 昵称、头像、地区及性别
    }).then(res => {

      const wxUserInfo = res.userInfo;
      console.log("用户信息 userinfo:", wxUserInfo);

      // POST user 创建用户
      request({
        url: `${gData.apiUrl}/user`,
        method: "POST",
        header: getHeader("urlencoded"),
        data: wxUserInfo
      }).then(res => {

        console.log("POST user 用户创建成功", res);
        const data = res.data.data;

        // 新注册用户肯定没实名，所以跳过 setIdentity()
        this.setUserData(data, data.token);
        this.setIsLogin();

        // 之前获取的 wxCode 无效了，要再获取一次
        promisify(wx.login)().then(res => {
          wxCode = res.code;

          // POST user auth 创建登录渠道
          request({
            url: `${gData.apiUrl}/user/${gData.uid}/authentication`,
            method: "POST",
            header: getHeader("urlencoded", gData.token),
            data: { loginType: 0, wxCode },
            complete: () => wx.hideLoading()
          }).then(
            () => console.log("POST user auth 登录渠道创建成功", res)
          ).catch(
            err => catchError("POST user auth", "登录渠道创建失败", err)
          );
        });

      }).catch(err => {
        wx.hideLoading();
        catchError("POST user", "用户创建失败", err);
      });

    });

  },

  /*
  // 更新用户数据
  updateUserInfo: () => wx.getUserProfile({
    lang: "zh_CN",
    desc: "上应小风筝需要获得您的公开信息"
  }).then(
    res => request({
      method: "PUT",
      url: `${gData.apiUrl}/user/${gData.uid}`,
      header: getHeader("urlencoded", gData.token),
      data: res.userInfo
    });
  )
*/

  // onLoad() {},
  // onReady() {},

  onShow() {
    this.data.verified !== gData.verified &&
    this.setData({ verified: gData.verified });
  }

})
