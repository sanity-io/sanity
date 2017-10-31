/* eslint-disable max-len */
import PropTypes from 'prop-types'
import React from 'react'

const AppLoadingScreenStyles = `
.sanity-app-loading-screen__root {
  display: block;
}

.sanity-app-loading-screen__inner {
  position: fixed;
  top: 50vh;
  left: 50vw;
  -webkit-transform: translateX(-50%) translateY(-50%);
          transform: translateX(-50%) translateY(-50%);
  text-align: center;
}

.sanity-app-loading-screen__text {
  font-weight: 400
  font-size: 5em;
  font-family: sans-serif;
  margin-top: 6rem;
  font-size: 12px;
}
.sanity-app-loading-screen__contetStudioLogo {
  display: block;
  top: 50vh;
  left: 50vw;
  position: absolute;
  width: 3rem;
  height: 3rem;
  transform: translate(-50%, -50%);
}
`

export default class AppLoadingScreen extends React.PureComponent {
  static propTypes = {
    text: PropTypes.string,
    logo: PropTypes.node
  }

  static defaultProps = {
    text: 'Loading Sanity Content Studio'
  }

  render() {
    return (
      <div className="sanity-app-loading-screen">
        <style type="text/css">{AppLoadingScreenStyles}</style>
        <svg className="sanity-app-loading-screen__contetStudioLogo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" textRendering="geometricPrecision" shapeRendering="geometricPrecision">
          <path id="ContetStudioLogoRed2" d="M31.8198,-0.152887C14.6198,-0.152887,-0.180693,5.34827,-0.180693,14.0483C-0.180693,14.0483,-0.116819,18.8939,-0.116819,27.9939C-0.116819,12.1939,23.9411,11.0675,31.8411,11.0675C39.7411,11.0675,63.8319,12.3036,63.8319,28.0036C63.8433,21.007,63.8093,17.833,63.8093,14.033C63.8093,5.23298,49.0198,-0.152887,31.8198,-0.152887z" fill="#f0abab" opacity="1" transform="translate(24.1089,24.3637) rotate(135) translate(-32,-32)" />
          <path id="ContetStudioLogoBlue1" d="M31.9068,-0.289009C14.7068,-0.289009,-0.09946,7.34292,-0.09946,16.0429C-0.09946,16.0429,-0.09946,20.9443,-0.09946,30.0443C-0.09946,14.2443,23.9888,11.047,31.8888,11.047C39.7888,11.047,63.8771,16.0398,63.8771,30.0443C63.8932,23.0516,63.9012,19.867,63.9012,16.067C63.9012,7.26694,49.1068,-0.289009,31.9068,-0.289009z" fill="#b8d8d9" opacity="1" transform="translate(25.7491,38.3927) rotate(45) translate(-32,-32)" />
          <path id="ContetStudioLogoBlue2" d="M32,0C14.8,0,0,7.3,0,16C0,16,0,20.9,0,30C0,14.2,23.3,11.1,31.2,11.1C39.1,11.1,64,14.3,64,30C63.8,25.7,64,19.8,64,16C64,7.19996,49.2,0,32,0z" fill="#0b8b97" opacity="1" transform="translate(38.3578,25.6334) rotate(225) translate(-32,-32)" />
          <path id="ContetStudioLogoRed1" d="M32,0C14.8,0,0,7.3,0,16C0,16,0,20.9,0,30C0,14.2,23.3,11.1,31.2,11.1C39.1,11.1,64,14.3,64,30C63.8,25.7,64,19.8,64,16C64,7.19996,49.2,0,32,0z" fill="#ff0000" opacity="1" transform="translate(38.364,38.364) rotate(-45) translate(-32,-32)" />
          <script>
            {`
              window.contentStudioLogoAnimation=function(){function F(a){return"undefined"!==typeof a}function v(a,b){return a&&0==a.indexOf(b)}function M(a){if(!isFinite(a))throw"non-finite value";}function N(a){if(14>=a)return 16;(a=W[a])||(a=0);return a}function D(a){return 0<=a?Math.pow(a,1/3):-Math.pow(-a,1/3)}function X(a,b,c,d){if(0==a)return 0==b?b=-d/c:(a=Math.sqrt(c*c-4*b*d),d=(-c+a)/(2*b),0<=d&&1>=d?b=d:(d=(-c-a)/(2*b),b=0<=d&&1>=d?d:0)),b;var e=c/a-b*b/(a*a)/3;c=b*b*b/(a*a*a)/13.5-b*c/(a*a)/3+d/a;var k=c*c/4+e*e*e/27;b=-b/
          (3*a);if(0>=k){if(0==e&&0==c)return-D(d/a);a=Math.sqrt(c*c/4-k);d=Math.acos(-c/2/a);c=Math.cos(d/3);d=Math.sqrt(3)*Math.sin(d/3);a=D(a);e=2*a*c+b;if(0<=e&&1>=e)return e;e=-a*(c+d)+b;if(0<=e&&1>=e)return e;e=a*(d-c)+b;if(0<=e&&1>=e)return e}else{a=D(-c/2+Math.sqrt(k));c=D(-c/2-Math.sqrt(k));d=a+c+b;if(0<=d&&1>=d)return d;d=-(a+c)/2+b;if(0<=d&&1>=d)return d}return 0}function Y(a,b){if(48==a&&"number"===typeof b)return"#"+("000000"+b.toString(16)).substr(-6);if(64==a)return b=b.map(function(a){return a+
          "px"}),b.join(",");if(96==a){a="";for(var c=b.length,d=0;d<c;d+=2)a+=b[d],a+=b[d+1].join(",");return a}if(80==a){if(0==b[0])return"none";a="";c=b.length;for(d=0;d<c;)a+=Q[b[d]],1==b[d]?a+="("+b[d+1]+") ":5==b[d]?(a+="("+b[d+1]+"px "+b[d+2]+"px "+b[d+3]+"px rgba("+(b[d+4]>>>24)+","+(b[d+4]>>16&255)+","+(b[d+4]>>8&255)+","+(b[d+4]&255)/255+")) ",d+=3):a=2==b[d]?a+("("+b[d+1]+"px) "):7==b[d]?a+("("+b[d+1]+"deg) "):a+("("+(0>b[d+1]?0:b[d+1])+") "),d+=2;return a}return 32==a?b+"px":b}function w(a){return 0>=
          a?0:255<=a?255:a}function Z(a,b,c,d){if(16==a||32==a)return(c-b)*d+b;if(0==a)return.5>d?b:c;if(48==a){if("number"===typeof b&&"number"===typeof c){var e=1-d;return w(e*(b>>16)+d*(c>>16))<<16|w(e*(b>>8&255)+d*(c>>8&255))<<8|w(e*(b&255)+d*(c&255))}return.5>d?b:c}if(64==a){0==b.length&&(b=[0]);0==c.length&&(c=[0]);var k=b.length;b.length!=c.length&&(k=b.length*c.length);var g=[];for(a=0;a<k;++a){var f=b[a%b.length];var h=(c[a%c.length]-f)*d+f;0>h&&(h=0);g.push(h)}return g}if(96==a){if(b.length!=c.length)return.5>
          d?b:c;k=b.length;g=[];for(a=0;a<k;a+=2){if(b[a]!==c[a])return.5>d?b:c;g[a]=b[a];g[a+1]=[];for(f=0;f<b[a+1].length;++f)g[a+1].push((c[a+1][f]-b[a+1][f])*d+b[a+1][f])}return g}if(80==a){k=b.length;if(k!=c.length)return.5>d?b:c;g=[];for(a=0;a<k;){if(b[a]!=c[a]||1==b[a])return.5>d?b:c;g[a]=b[a];g[a+1]=(c[a+1]-b[a+1])*d+b[a+1];if(5==b[a]){g[a+2]=(c[a+2]-b[a+2])*d+b[a+2];g[a+3]=(c[a+3]-b[a+3])*d+b[a+3];e=1-d;var l=b[a+4],q=c[a+4];h=e*(l>>>24)+d*(q>>>24);var m=e*(l>>16&255)+d*(q>>16&255);f=e*(l>>8&255)+
          d*(q>>8&255);g[a+4]=(w(m)<<16|w(f)<<8|w(e*(l&255)+d*(q&255)))+16777216*(w(h)|0);a+=3}a+=2}return g}return 0}function R(a,b){a:{var c=a+b[2];var d=b[4].length;for(var e=0;e<d;++e)if(c<b[4][e]){c=e;break a}c=d-1}d=b[2];e=b[4][c-1]-d;a=(a-e)/(b[4][c]-d-e);if(b[6]&&b[6].length>c-1)if(d=b[6][c-1],1==d[0])if(0>=a)a=0;else if(1<=a)a=1;else{e=d[1];var k=d[3];a=X(3*e-3*k+1,-6*e+3*k,3*e,-a);a=3*a*(1-a)*(1-a)*d[2]+3*a*a*(1-a)*d[4]+a*a*a}else 2==d[0]?(d=d[1],a=Math.ceil(a*d)/d):3==d[0]&&(d=d[1],a=Math.floor(a*
          d)/d);return Z(b[1]&240,b[5][c-1],b[5][c],a)}function O(){z=(new Date).getTime()}function A(a){for(var b=!1,c=0;c<x.length;++c)x[c].F(a)&&(b=!0);x.forEach(function(a){a.l&&(a.l=!1,a.onfinish&&(a.onfinish(),b=!0))});return b}function S(){O();A(!0)?(J=!0,K(S)):J=!1}function P(){J||(J=!0,K(S))}function T(a,b){var c=[];a.split(b).forEach(function(a){c.push(parseFloat(a))});return c}function t(a){-1==a.indexOf(",")&&(a=a.replace(" ",","));return T(a,",")}function U(a){a._ks||(a._ks={H:L},++L);if(!a._ks.transform){for(var b=
          a._ks.transform=[],c=0;14>=c;++c)b[c]=0;if(c=a.getAttribute("transform")){for(c=c.trim().split(") ");0<a._ks.w;)c.shift(),--a._ks.w;a=c.shift();v(a,"translate(")&&(a=t(a.substring(10)),b[1]=a[0],b[2]=a[1],a=c.shift());v(a,"rotate(")&&(a=t(a.substring(7)),b[6]=a[0],a=c.shift());v(a,"skewX(")&&(a=t(a.substring(6)),b[7]=a[0],a=c.shift());v(a,"skewY(")&&(a=t(a.substring(6)),b[8]=a[0],a=c.shift());v(a,"scale(")&&(a=t(a.substring(6)),b[10]=a[0],b[11]=a[1],a=c.shift());v(a,"translate(")&&(a=t(a.substring(10)),
          b[13]=a[0],b[14]=a[1])}}}function V(a){this.C=a;this.v=[];this.o=[];this.g=0;this.i=this.a=this.b=null;this.f=this.A=this.l=this.h=!1}function H(a,b,c){b=a[b];void 0===b&&(b=a[c]);return b}function aa(a){return Array.isArray(a)?a:v(a,"cubic-bezier(")?(a=a.substring(13,a.length-1).split(","),[1,parseFloat(a[0]),parseFloat(a[1]),parseFloat(a[2]),parseFloat(a[3])]):v(a,"steps(")?(a=a.substring(6,a.length-1).split(","),[a[1]&&"start"==a[1].trim()?2:3,parseFloat(a[0])]):[0]}function ba(a){a=a.trim();return v(a,
          "#")?(parseInt(a.substring(1),16)<<8)+255:v(a,"rgba(")?(a=a.substring(5,a.length-1),a=a.split(","),(parseInt(a[0],10)<<24)+(parseInt(a[1],10)<<16)+(parseInt(a[2],10)<<8)+255*parseFloat(a[3])<<0):a}var ca=" translate translate    rotate skewX skewY  scale scale  translate translate".split(" "),Q="none url blur brightness contrast drop-shadow grayscale hue-rotate invert opacity saturate sepia".split(" "),K=window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||
          window.oRequestAnimationFrame||window.msRequestAnimationFrame||null;K||(K=function(a){window.setTimeout(a,16)});var L=0,W={d:97,fill:48,fillOpacity:16,filter:80,height:33,opacity:16,stroke:48,strokeDasharray:64,strokeDashoffset:32,strokeOpacity:16,strokeWidth:32,transform:1,width:33},J=!1,z=(new Date).getTime(),x=[];V.prototype={j:function(a){var b=!1;if(null!==this.b){var c=this.c();null!==c&&c>=this.g?(b=!0,a?this.a=c:this.a=this.i?Math.max(this.i,this.g):this.g):null!==c&&(a&&null!==this.a&&(this.b=
          z-this.a/1),this.a=null)}this.i=this.c();return b},F:function(a){a&&(this.h&&(this.h=!1,null===this.b&&(null!==this.a?(this.b=z-this.a/1,this.a=null):this.b=z)),null===this.a&&null!==this.b&&this.j(!1)&&(this.l=!0));a=this.c();if(null===a)return!1;for(var b=this.v,c=this.o,d=0;d<b.length;++d){for(var e=b[d],k=!1,g=0;g<c[d].length;++g){var f=c[d][g],h=f[0];if(null!==h){var l=f[2];var q=f[4].length,m=f[4][q-1]-l;l=0==m?f[5][q-1]:a<=l?f[5][0]:a>=l+f[3]?0==f[3]%m?f[5][q-1]:R(f[3]%m,f):R((a-l)%m,f);0==
          h?(e._ks.mpath=f[8],e._ks.transform[h]=l,k=!0):14>=h?(e._ks.transform[h]=l,k=!0):(l=Y(f[1]&240,l),f[1]&1?e.setAttribute(h,l):e.style[h]=l)}}if(k){U(e);k=e._ks.transform;g="";if(f=e._ks.mpath)l=k[0]*f[2]/100,h=f[1].getPointAtLength(l),g="translate("+h.x+","+h.y+") ",f[0]&&(.5>l?(l=h,h=f[1].getPointAtLength(.5)):l=f[1].getPointAtLength(l-.5),g+="rotate("+180*Math.atan2(h.y-l.y,h.x-l.x)/Math.PI+") ");for(f=1;f<k.length;++f)if(h=k[f])g+=" "+ca[f]+"(",g=2>=f?g+(1==f?h+",0":"0,"+h):13<=f?g+(13==f?h+",0":
          "0,"+h):10<=f?g+(10==f?h+",1":"1,"+h):g+h,g+=")";e.setAttribute("transform",g)}}return"running"==this.B()},s:function(){if(!this.A){this.A=!0;for(var a=this.v,b=this.o,c=0;c<a.length;++c)for(var d=a[c],e=!1,k=0;k<b[c].length;++k){var g=b[c][k][0];14>=g?d._ks.G||(U(d),d._ks.G=d._ks.transform.slice()):(d._ks.m||(d._ks.m={}),F(d._ks.m[g])||(e||(e=getComputedStyle(d)),d._ks.m[g]=N(g)&1?d.getAttribute(g):e[g]))}}},play:function(a){F(a)&&this.u(a,!0);if(!this.f)return this;a=this.c();if(null===a||0>a||
          a>=this.g)this.a=0;if(null===this.a)return this;this.b=null;this.h=!0;this.s();A(!1);P();return this},pause:function(a){F(a)&&this.u(a,!0);if(!this.f||"paused"==this.B())return this;F(a)||O();a=this.c();null===a&&(this.a=0);null!==this.b&&null===this.a&&(this.a=a);this.b=null;this.h=!1;this.j(!1);this.s();A(!1);return this},c:function(){return null!==this.a?this.a:null===this.b?null:1*(z-this.b)},u:function(a,b){M(a);b&&O();null!==a&&(this.s(),null!==this.a||null===this.b?(this.a=a,A(!1)):this.b=
          z-a/1,this.f||(this.b=null),this.i=null,this.j(!0),P())},I:function(){return this.c()},time:function(a){return F(a)?(this.f&&this.u(a,!0),this):this.I()},startTime:function(a){if(F(a)){M(a);if(!this.f)return this;this.i=this.c();this.b=a;null!==a?this.a=null:this.a=this.i;this.h=!1;this.j(!0);A(!1);P();return this}return this.D?this.D[0].startTime:this.b},B:function(){var a=this.c();return this.h?"running":null===a?"idle":null===this.b?"paused":a>=this.g?"finished":"running"}};return{setmptr:function(a){for(var b in a){var c=
          document.getElementById(b);c._ks||(c._ks={});c._ks.w=a[b]}},animate:function(){if(0<x.length)throw"data already set";var a={};if(1==arguments.length%2){a=arguments[arguments.length-1];var b={};for(c in a)b[c]=a[c];a=b}var c=new V(a);a=arguments;for(var d=b=0;d<a.length-1;d+=2){var e=a[d];var k=e instanceof Element?e:document.getElementById(e.substring(1));if(!k)throw"invalid target: "+e;e=k;k=a[d+1];e._ks||(e._ks={H:L},++L);for(var g=[],f=0;f<k.length;++f){var h=k[f],l=H(h,"p","property");14>=l||
          -1==l.indexOf("-")||(l=null);var q=N(l);q||(q=0);var m=H(h,"t","times");if(!m||2>m.length)throw"not enough times";m=m.slice();if(!isFinite(m[0])||0>m[0])throw"bad time: "+m[0];for(var y=1;y<m.length;++y)if(!isFinite(m[y])||0>m[y]||m[y]<m[y-1])throw"bad time: "+m[y];y=m[0];var w=m[m.length-1]-y,z=h.iterations||0;1>z&&(z=1);w*=z;b<w+y&&(b=w+y);var t=H(h,"v","values");if(!t||t.length!=m.length)throw"values don't match times";t=t.slice();for(var B=l,n=t,A=N(B)&240,p=0;p<n.length;++p)if(96==A){for(var G=
          n[p].substring(6,n[p].length-2).match(/[A-DF-Za-df-z][-+0-9eE., ]*/ig),I=[],r=0;r<G.length;++r){I.push(G[r][0]);for(var u=1<G[r].trim().length?G[r].substring(1).split(","):[],E=0;E<u.length;++E)u[E]=parseFloat(u[E]);I.push(u)}n[p]=I}else if(48==A)if(v(n[p],"#"))n[p]=parseInt(n[p].substring(1),16);else{if(!v(n[p],"url(")&&"none"!=n[p])throw"invalid color: "+n[p];}else if(80==A){G=n;I=p;r=n[p];if("none"==r)r=[0];else{u=[];for(var C=r.indexOf("(");0<C;)if(E=Q.indexOf(r.substring(0,C)),0<=E){u.push(E);
          var D=r.indexOf(") ");0>D&&(D=r.length-1);C=r.substring(C+1,D).split(" ");5==E?(u.push(parseFloat(C[0])),u.push(parseFloat(C[1])),u.push(parseFloat(C[2])),u.push(ba(C[3]))):1==E?u.push(C[0]):u.push(parseFloat(C[0]));r=r.substring(D+1).trim();C=r.indexOf("(")}else break;r=u}G[I]=r}else if(64==A)if("none"!=n[p]){if(!/^[0-9 .]*$/.test(n[p]))throw"bad value: "+n[p];n[p]=T(n[p]," ")}else n[p]=[0];else 32==A?(M(n[p]),n[p]=parseFloat(n[p])):0===B&&(n[p]=parseFloat(n[p]));B=H(h,"e","easing");n=m.length;for(B||
          (B=[]);B.length<n;)B.push([1,0,0,.58,1]);for(n=0;n<B.length;++n)B[n]=aa(B[n]);q=[l,q,y,w,m,t,B,z];m=H(h,"m","motionPath");F(m)&&0===l&&(q[8]=[],q[8][0]=h.motionRotate,h=document.createElementNS("http://www.w3.org/2000/svg","path"),m||(m="M0,0"),h.setAttribute("d",m),q[8][1]=h,q[8][2]=h.getTotalLength());g.push(q)}0<g.length&&(c.v.push(e),c.o.push(g))}c.g=b;!1===c.f&&(x.push(c),c.f=!0,!1!==c.C.autoplay&&c.play());return c},_priv_list:function(){return x.slice()},play:function(){return x[0]?x[0].play():
          this},pause:function(){return x[0]?x[0].pause():this},time:function(a){return x[0]?x[0].time(a):F(a)?this:null}}}();
          document.contentStudioLogoAnimation=contentStudioLogoAnimation;(function(ks){
          ks.animate("#ContetStudioLogoRed2",[{p:'opacity',t:[0,1218,1500,1718,2000],v:[1,1,0,1,1],e:[[0],[0],[0],[0],[0]],iterations:Infinity},{p:'d',t:[0,531,1000,1500,1531,2000],v:["path('M31.8198,-0.152887C14.6198,-0.152887,-0.180693,5.34827,-0.180693,14.0483C-0.180693,14.0483,-0.116819,18.8939,-0.116819,27.9939C-0.116819,12.1939,23.9411,11.0675,31.8411,11.0675C39.7411,11.0675,63.8319,12.3036,63.8319,28.0036C63.8433,21.007,63.8093,17.833,63.8093,14.033C63.8093,5.23298,49.0198,-0.152887,31.8198,-0.152887Z')","path('M31.8038,13.9517C14.6038,13.9517,10.3384,14.018,-0.161616,14.018C-0.161616,14.018,-0.18039,21.0207,-0.171003,27.9952C10.6334,28.8307,24.0402,28.1057,31.9402,28.1057C39.8402,28.1057,53.3294,28.0328,63.8294,28.0328C63.8106,21.0113,63.8012,17.818,63.8012,14.018C54.3012,14.018,49.0038,13.9517,31.8038,13.9517Z')","path('M31.8198,33.7067C14.6198,33.7067,-0.0937039,20.8851,-0.0937039,14.0532C-0.0937039,14.0532,-0.140498,18.851,-0.140498,27.951C-0.140498,38.951,23.9198,44.4693,31.8198,44.4693C39.7198,44.4693,63.7768,38.3882,63.7768,27.8882C63.7768,20.8189,63.7768,17.7433,63.7768,13.9433C63.7768,27.9433,49.0198,33.7067,31.8198,33.7067Z')","path('M31.7785,53.0303C14.5785,53.0303,-0.194251,38.8008,-0.194251,21.0008C-0.194251,21.0008,-0.194251,20.9734,-0.194251,20.9734C-0.194251,39.7734,15.7579,53.0509,31.7579,53.0509C50.6512,53.0509,63.839,36.9524,63.839,21.0524C63.9008,21.0317,63.7857,21.0175,63.8462,21.0434C63.8462,39.1815,48.9785,53.0303,31.7785,53.0303Z')","path('M31.7399,-10.957C14.5399,-10.957,-0.222851,3.37264,-0.222851,21.0664C-0.222851,21.0664,-0.222851,20.6239,-0.222851,21.0664C-0.222851,5.48596,12.6065,-10.957,31.6599,-10.957C50.7326,-10.957,63.8248,5.31515,63.8248,21.0152C63.8248,21.0152,63.8158,21.0789,63.8248,21.0152C63.8248,3.42599,48.9399,-10.957,31.7399,-10.957Z')","path('M31.8198,-0.152887C14.6198,-0.152887,-0.180693,5.34827,-0.180693,14.0483C-0.180693,14.0483,-0.116819,18.8939,-0.116819,27.9939C-0.116819,12.1939,23.9411,11.0675,31.8411,11.0675C39.7411,11.0675,63.8319,12.3036,63.8319,28.0036C63.8433,21.007,63.8093,17.833,63.8093,14.033C63.8093,5.23298,49.0198,-0.152887,31.8198,-0.152887Z')"],e:[[0],[0],[0],[0],[0],[0]],iterations:Infinity}],
          "#ContetStudioLogoBlue1",[{p:'opacity',t:[0,1218,1500,1718,2000],v:[1,1,0,1,1],e:[[0],[0],[0],[0],[0]],iterations:Infinity},{p:'d',t:[0,531,1000,1500,1531,2000],v:["path('M31.9068,-0.289009C14.7068,-0.289009,-0.09946,7.34292,-0.09946,16.0429C-0.09946,16.0429,-0.09946,20.9443,-0.09946,30.0443C-0.09946,14.2443,23.9888,11.047,31.8888,11.047C39.7888,11.047,63.8771,16.0398,63.8771,30.0443C63.8932,23.0516,63.9012,19.867,63.9012,16.067C63.9012,7.26694,49.1068,-0.289009,31.9068,-0.289009Z')","path('M32,16C14.8,16,10.5,16,0,16C0,16,0,20.9,0,30C11,30,24.1,30,32,30C39.9,30,53.5,30,64,30C63.8,25.7,64,19.8,64,16C54.5,16,49.2,16,32,16Z')","path('M32,35C14.8,35,0,30,0,16C0,16,0,20.9,0,30C0,41,24.1,46,32,46C39.9,46,64,40.5,64,30C63.8,25.7,64,19.8,64,16C64,30,49.2,35,32,35Z')","path('M31.9179,55.0576C14.7179,55.0576,0,41,0,23.2C0,23.2,0,23.2,0,23.2C0,42,15.9179,55.0576,31.9179,55.0576C50.9179,55.0576,64,38.9,64,23C63.8,18.7,64,26.8,64,23C64,40.6,49.1179,55.0576,31.9179,55.0576Z')","path('M32,-9C14.8,-9,0,4.5,0,23C0,23,0,13.9,0,23C0,7.2,12.5,-9,32,-9C51.5,-9,64,7.3,64,23C63.8,18.7,64,26.8,64,23C64,5,49.2,-9,32,-9Z')","path('M31.9068,-0.289009C14.7068,-0.289009,-0.09946,7.34292,-0.09946,16.0429C-0.09946,16.0429,-0.09946,20.9443,-0.09946,30.0443C-0.09946,14.2443,23.9888,11.047,31.8888,11.047C39.7888,11.047,63.8771,16.0398,63.8771,30.0443C63.8932,23.0516,63.9012,19.867,63.9012,16.067C63.9012,7.26694,49.1068,-0.289009,31.9068,-0.289009Z')"],e:[[0],[0],[0],[0],[0],[0]],iterations:Infinity}],
          "#ContetStudioLogoBlue2",[{p:'opacity',t:[0,1218,1500,1718,2000],v:[1,1,0,1,1],e:[[0],[0],[0],[0],[0]],iterations:Infinity},{p:'d',t:[0,531,1000,1500,1531,2000],v:["path('M32,0C14.8,0,0,7.3,0,16C0,16,0,20.9,0,30C0,14.2,23.3,11.1,31.2,11.1C39.1,11.1,64,14.3,64,30C63.8,25.7,64,19.8,64,16C64,7.19996,49.2,0,32,0Z')","path('M32,16C14.8,16,10.5,16,0,16C0,16,0,20.9,0,30C11,30,24.1,30,32,30C39.9,30,53.5,30,64,30C63.8,25.7,64,19.8,64,16C54.5,16,49.2,16,32,16Z')","path('M32,35C14.8,35,0,30,0,16C0,16,0,20.9,0,30C0,41,24.1,46,32,46C39.9,46,64,40.5,64,30C63.8,25.7,64,19.8,64,16C64,30,49.2,35,32,35Z')","path('M32,55C14.8,55,0,41,0,23.2C0,23.2,0,23.2,0,23.2C0,42,16,55,32,55C51,55,64,38.9,64,23C63.8,18.7,64,26.8,64,23C64,40.6,49.2,55,32,55Z')","path('M32,-9C14.8,-9,0,4.5,0,23C0,23,0,13.9,0,23C0,7.2,12.5,-9,32,-9C51.5,-9,64,7.3,64,23C63.8,18.7,64,26.8,64,23C64,5,49.2,-9,32,-9Z')","path('M32,0C14.8,0,0,7.3,0,16C0,16,0,20.9,0,30C0,14.2,23.3,11.1,31.2,11.1C39.1,11.1,64,14.3,64,30C63.8,25.7,64,19.8,64,16C64,7.19996,49.2,0,32,0Z')"],e:[[0],[0],[0],[0],[0],[0]],iterations:Infinity}],
          "#ContetStudioLogoRed1",[{p:'opacity',t:[0,1218,1500,1718,2000],v:[1,1,0,1,1],e:[[0],[0],[0],[0],[0]],iterations:Infinity},{p:'d',t:[0,531,1000,1500,1531,2000],v:["path('M32,0C14.8,0,0,7.3,0,16C0,16,0,20.9,0,30C0,14.2,23.3,11.1,31.2,11.1C39.1,11.1,64,14.3,64,30C63.8,25.7,64,19.8,64,16C64,7.19996,49.2,0,32,0Z')","path('M32,16C14.8,16,10.5,16,0,16C0,16,0,20.9,0,30C11,30,24.1,30,32,30C39.9,30,53.5,30,64,30C63.8,25.7,64,19.8,64,16C54.5,16,49.2,16,32,16Z')","path('M32,35C14.8,35,0,30,0,16C0,16,0,20.9,0,30C0,41,24.1,46,32,46C39.9,46,64,40.5,64,30C63.8,25.7,64,19.8,64,16C64,30,49.2,35,32,35Z')","path('M32,55.2764C14.8,55.2764,-0.117655,40.6867,-0.117655,22.9864C-0.117655,22.9864,-0.0144828,23.007,-0.0144828,23.007C-0.0144828,40.5402,14.5898,55.0607,32,55.0607C51.54,55.0607,63.9954,37.9296,63.9954,22.9491C63.9656,22.9854,64.0751,22.9592,64.0922,22.9762C64.0922,40.3408,49.5282,55.2764,32,55.2764Z')","path('M32.0038,-8.99676C14.8038,-8.99676,0.00341815,4.58518,0.00341815,23.0071C0.00341815,23.0071,-0.300638,23.0141,-0.300638,23.0141C-0.300638,6.81093,12.343,-9.24781,32,-9.24781C51.0138,-9.24781,64.2653,6.47886,64.2653,23.0071C64.2653,23.0071,64.0076,23.0181,64.0001,23.0106C64.0001,5.99807,50.2124,-8.99676,32.0038,-8.99676Z')","path('M32,0C14.8,0,0,7.3,0,16C0,16,0,20.9,0,30C0,14.2,23.3,11.1,31.2,11.1C39.1,11.1,64,14.3,64,30C63.8,25.7,64,19.8,64,16C64,7.19996,49.2,0,32,0Z')"],e:[[0],[0],[0],[0],[0],[0]],iterations:Infinity}],
          {autoplay:document.location.search.substr(1).split('&').indexOf('autoplay=false')<0})
          })(contentStudioLogoAnimation);
    `}
          </script>
        </svg>

        <div className="sanity-app-loading-screen__inner">
          <div className="sanity-app-loading-screen__text">
            {this.props.text}
          </div>
        </div>
      </div>
    )
  }
}
