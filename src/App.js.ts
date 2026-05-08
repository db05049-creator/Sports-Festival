import React, { useState, useEffect, useMemo } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";

// 1. 질문자님이 캡처하신 실제 Firebase 설정값입니다.
const firebaseConfig = {
  apiKey: "AIzaSyCeactkC9AJxhVbv4wbcU3elS5W5rUtgJI",
  authDomain: "sports-festival-568c1.firebaseapp.com",
  databaseURL: "https://sports-festival-568c1-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sports-festival-568c1",
  storageBucket: "sports-festival-568c1.firebasestorage.app",
  messagingSenderId: "773920696038",
  appId: "1:773920696038:web:0c620cb6346668b368fd27"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default function SportsFestivalSite() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState("info");
  const [selectedGrade, setSelectedGrade] = useState(1);
  const adminPassword = "981015"; // 설정하신 관리자 비밀번호

  const [appData, setAppData] = useState({
    info: { "대회 목적": "", "대회 규정": "", "유의사항": "", "안전 수칙": "" },
    scores: { 1: {}, 2: {}, 3: {} },
    seatImage: "",
  });

  // --- 실시간 데이터 불러오기 ---
  useEffect(() => {
    const dataRef = ref(db, "festival_data");
    onValue(dataRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setAppData(data);
    });
  }, []);

  // --- 데이터 저장 (관리자 전용) ---
  const updateAndSave = (newData) => {
    if (!isAdmin) return;
    set(ref(db, "festival_data"), newData);
  };

  const handleScoreChange = (grade, classNum, event, value) => {
    const newData = { ...appData };
    if (!newData.scores[grade]) newData.scores[grade] = {};
    if (!newData.scores[grade][classNum]) newData.scores[grade][classNum] = {};
    newData.scores[grade][classNum][event] = value;
    setAppData(newData);
    updateAndSave(newData);
  };

  const handleInfoChange = (key, value) => {
    const newData = { ...appData, info: { ...appData.info, [key]: value } };
    setAppData(newData);
    updateAndSave(newData);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newData = { ...appData, seatImage: reader.result };
        setAppData(newData);
        updateAndSave(newData);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- 점수 합산 로직 ---
  const events = ["단체줄넘기", "줄다리기", "파도타기", "혼합릴레이", "협동바운스", "이어달리기"];
  const gradeClasses = { 1: 5, 2: 6, 3: 8 };

  const rankedData = useMemo(() => {
    const classes = Array.from({ length: gradeClasses[selectedGrade] || 0 }, (_, i) => i + 1);
    return classes.map(c => {
      const classScores = appData.scores[selectedGrade]?.[c] || {};
      const total = Object.values(classScores).reduce((acc, cur) => acc + (Number(cur) || 0), 0);
      return { classNum: c, total };
    }).sort((a, b) => b.total - a.total);
  }, [appData, selectedGrade]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      <nav className="bg-white shadow-md p-4 sticky top-0 z-50 flex justify-between items-center">
        <h1 className="text-xl font-bold text-sky-600">상모중 체육한마당</h1>
        <div className="flex gap-2">
          {!isAdmin ? (
            <div className="flex gap-1">
              <input type="password" placeholder="비번" className="border rounded px-2 w-20 text-sm" onChange={(e) => setPassword(e.target.value)} />
              <button onClick={() => password === adminPassword && setIsAdmin(true)} className="bg-sky-500 text-white px-2 py-1 rounded text-xs">관리자</button>
            </div>
          ) : (
            <button onClick={() => setIsAdmin(false)} className="text-red-500 text-xs font-bold">로그아웃</button>
          )}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {["info", "score", "seat"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${activeTab === tab ? 'bg-sky-500 text-white' : 'bg-white border'}`}>
              {tab === "info" ? "📢 안내" : tab === "score" ? "🏆 점수" : "🪑 자리"}
            </button>
          ))}
        </div>

        {activeTab === "info" && (
          <div className="grid gap-4">
            {Object.entries(appData.info).map(([title, content]) => (
              <div key={title} className="bg-white p-4 rounded-xl shadow">
                <h3 className="font-bold mb-2 text-sky-600">{title}</h3>
                <textarea className="w-full h-24 p-2 bg-slate-50 rounded" disabled={!isAdmin} value={content} onChange={(e) => handleInfoChange(title, e.target.value)} />
              </div>
            ))}
          </div>
        )}

        {activeTab === "score" && (
          <div className="space-y-6">
            <div className="flex gap-2">
              {[1, 2, 3].map(g => (
                <button key={g} onClick={() => setSelectedGrade(g)} className={`px-4 py-2 rounded-lg ${selectedGrade === g ? 'bg-sky-600 text-white' : 'bg-white border'}`}>{g}학년</button>
              ))}
            </div>
            <div className="bg-white rounded-xl shadow overflow-x-auto">
              <table className="w-full text-sm text-center">
                <thead className="bg-slate-100 font-bold">
                  <tr>
                    <th className="p-3">반</th>
                    {events.map(e => <th key={e}>{e}</th>)}
                    <th className="p-3 bg-yellow-50">합계</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: gradeClasses[selectedGrade] }, (_, i) => i + 1).map(c => (
                    <tr key={c} className="border-t">
                      <td className="p-3 font-bold">{c}반</td>
                      {events.map(e => (
                        <td key={e}>
                          <input type="number" className="w-12 border rounded p-1 text-center disabled:bg-transparent disabled:border-none" disabled={!isAdmin} value={appData.scores[selectedGrade]?.[c]?.[e] || ""} onChange={(el) => handleScoreChange(selectedGrade, c, e, el.target.value)} />
                        </td>
                      ))}
                      <td className="p-3 font-black text-sky-600 bg-yellow-50">{rankedData.find(r => r.classNum === c)?.total || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-white p-4 rounded-xl shadow">
              <h3 className="font-bold text-lg mb-3">🥇 실시간 순위 ({selectedGrade}학년)</h3>
              {rankedData.map((data, i) => (
                <div key={data.classNum} className="flex justify-between py-2 border-b last:border-0">
                  <span>{i + 1}위: {data.classNum}반</span>
                  <span className="font-bold text-sky-600">{data.total}점</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "seat" && (
          <div className="bg-white p-4 rounded-xl shadow text-center">
            {isAdmin && <input type="file" onChange={handleImageUpload} className="mb-4 block mx-auto text-sm" />}
            {appData.seatImage ? <img src={appData.seatImage} className="max-w-full rounded mx-auto" alt="배치도" /> : <p className="text-slate-400 py-20 font-bold">이미지가 없습니다.</p>}
          </div>
        )}
      </main>

      {isAdmin && <div className="fixed bottom-5 right-5 bg-red-500 text-white px-4 py-2 rounded-full font-bold shadow-lg animate-pulse">편집 모드</div>}
    </div>
  );
}