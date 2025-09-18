import { useState, useEffect } from "react";

/*
  App.js - شبكة سلطان نت
  نسخة كاملة ومحسّنة مع:
  - اسم الشبكة أعلى تسجيل الدخول وفوق الترحيب
  - ملاحظة: الكروت المتوفرة أبو 500 ريال فقط
  - تحسين شكل الحقول والأزرار
  - لوحة إدارة: بحث، حذف مستخدم، إضافة كروت دفعة واحدة، تعديل كرت، تعديل رصيد
  - حفظ البيانات في localStorage
*/

const admin = {
  username: "admin",
  password: "admin123",
};

export default function App() {
  const [step, setStep] = useState("login"); // 'login' | 'dashboard' | 'adminDashboard'
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [balance, setBalance] = useState(0);
  const [card, setCard] = useState(null);

  // لوحة الإدارة
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newBalance, setNewBalance] = useState("");
  const [newCards, setNewCards] = useState(""); // لإضافة عدة كروت دفعة واحدة (كل سطر كرت)
  const [searchTerm, setSearchTerm] = useState(""); // بحث عن عميل
  const [editCardIndex, setEditCardIndex] = useState(null); // {user, index} أو null
  const [editCardValue, setEditCardValue] = useState("");

  const [users, setUsers] = useState({});
  const cardValue = 500; // قيمة كل كرت عند الطلب

  // ====== استدعاء أولي: جلب المستخدمين من localStorage أو إعداد بيانات تجريبية ======
  useEffect(() => {
    const stored = localStorage.getItem("users");
    if (stored) {
      setUsers(JSON.parse(stored));
    } else {
      const initial = {
        user1: { password: "1234", balance: 5000, issuedCards: [] },
        user2: { password: "abcd", balance: 3000, issuedCards: [] },
        user3: { password: "qwerty", balance: 2000, issuedCards: [] },
      };
      setUsers(initial);
      localStorage.setItem("users", JSON.stringify(initial));
    }
  }, []);

  const saveUsers = (newUsers) => {
    setUsers(newUsers);
    localStorage.setItem("users", JSON.stringify(newUsers));
  };

  // ====== عملية تسجيل الدخول ======
  const handleLogin = () => {
    if (username === admin.username && password === admin.password) {
      setStep("adminDashboard");
      setLoggedIn(false);
      // لا نعرض رصيد للمدير هنا
    } else if (users[username] && users[username].password === password) {
      setLoggedIn(true);
      setBalance(users[username].balance);
      setStep("dashboard");
      setCard(null);
    } else {
      alert("خطأ في اسم المستخدم أو كلمة السر");
    }
  };

  // ====== عندما يطلب المستخدم كرت: يعطى أول كرت في قائمته ويُخصم رصيد 500 ======
  const handleRequestCard = () => {
    const userData = users[username];
    if (!userData) {
      alert("حدث خطأ: مستخدم غير موجود");
      return;
    }

    if (!userData.issuedCards || userData.issuedCards.length === 0) {
      alert("لا يوجد كروت متوفرة لديك حاليا");
      return;
    }

    if (userData.balance < cardValue) {
      alert("رصيدك غير كافٍ لطلب الكرت");
      return;
    }

    const nextCard = userData.issuedCards[0];
    setCard(nextCard);

    const newBalance = userData.balance - cardValue;
    const updated = {
      ...users,
      [username]: {
        ...userData,
        balance: newBalance,
        issuedCards: userData.issuedCards.slice(1), // إزالة أول كرت بعد إصداره
      },
    };
    saveUsers(updated);
    setBalance(newBalance);
  };

  // ====== نسخ الكرت إلى الحافظة وإخفاءه ======
  const handleCopyAndHide = async () => {
    if (!card) return;
    try {
      await navigator.clipboard.writeText(card);
      alert("تم نسخ الكرت بنجاح!");
      setCard(null);
    } catch (err) {
      alert("حدث خطأ أثناء النسخ");
    }
  };

  // ====== إضافة مستخدم جديد ======
  const handleAddUser = () => {
    if (!newUsername || !newPassword || newBalance === "") {
      alert("يرجى ملء كل الحقول");
      return;
    }
    if (users[newUsername]) {
      alert("المستخدم موجود مسبقًا");
      return;
    }
    const updated = {
      ...users,
      [newUsername]: {
        password: newPassword,
        balance: parseInt(newBalance),
        issuedCards: [],
      },
    };
    saveUsers(updated);
    alert(`تم إضافة المستخدم ${newUsername}`);
    setNewUsername("");
    setNewPassword("");
    setNewBalance("");
  };

  // ====== تعديل رصيد مستخدم ======
  const handleEditBalance = (user) => {
    const amount = prompt(`أدخل الرصيد الجديد للمستخدم ${user}:`, users[user].balance);
    if (amount !== null) {
      const newAmount = parseInt(amount);
      if (!isNaN(newAmount)) {
        const updated = { ...users, [user]: { ...users[user], balance: newAmount } };
        saveUsers(updated);
        if (user === username) setBalance(newAmount);
      } else {
        alert("أدخل رقمًا صحيحًا");
      }
    }
  };

  // ====== حذف مستخدم ======
  const handleDeleteUser = (user) => {
    if (!window.confirm(`هل تريد حذف المستخدم ${user}؟ هذا الإجراء نهائي.`)) return;
    const updated = { ...users };
    delete updated[user];
    saveUsers(updated);
    // إذا كانت الصفحة حالياً تعرض ذلك المستخدم، نرجع للوحة الدخول
    if (step === "dashboard" && user === username) {
      setStep("login");
      setLoggedIn(false);
      setUsername("");
      setPassword("");
      setCard(null);
    }
  };

  // ====== إضافة عدة كروت دفعة واحدة لمستخدم (كل سطر كرت) ======
  const handleAddCardsToUser = (user) => {
    if (!newCards.trim()) {
      alert("أدخل كروت على الأقل");
      return;
    }
    const cardsArray = newCards
      .split("\n")
      .map((c) => c.trim())
      .filter((c) => c !== "");

    if (cardsArray.length === 0) {
      alert("لم يتم العثور على كروت صحيحة");
      return;
    }

    // تفادي تكرار نفس الكرت داخل نفس المستخدم
    const current = users[user].issuedCards || [];
    const filtered = cardsArray.filter((c) => !current.includes(c));
    if (filtered.length === 0) {
      alert("جميع الكروت موجودة مسبقًا للمستخدم");
      return;
    }

    const updated = {
      ...users,
      [user]: {
        ...users[user],
        issuedCards: [...current, ...filtered],
      },
    };
    saveUsers(updated);
    alert(`تمت إضافة ${filtered.length} كرت للمستخدم ${user}`);
    setNewCards("");
  };

  // ====== بدء تحرير كرت معين لمستخدم ======
  const handleEditCard = (user, index) => {
    setEditCardIndex({ user, index });
    setEditCardValue(users[user].issuedCards[index]);
  };

  // ====== حفظ التعديل على الكرت ======
  const handleSaveCardEdit = () => {
    if (!editCardIndex) return;
    const { user, index } = editCardIndex;
    if (!editCardValue || editCardValue.trim() === "") {
      alert("قيمة الكرت لا يمكن أن تكون فارغة");
      return;
    }
    const updated = { ...users };
    // تفادي تكرار القيمة بعد التعديل داخل نفس القائمة
    if (updated[user].issuedCards.some((c, i) => c === editCardValue && i !== index)) {
      alert("هذا الكرت موجود بالفعل في قائمة المستخدم");
      return;
    }
    updated[user].issuedCards[index] = editCardValue.trim();
    saveUsers(updated);
    setEditCardIndex(null);
    setEditCardValue("");
  };

  // ====== فلترة المستخدمين للبحث ======
  const filteredUsers = Object.keys(users).filter((u) => u.toLowerCase().includes(searchTerm.toLowerCase()));

  // ====== تنسيقات سريعة inline لتبدو أفضل بدون ملفات CSS خارجية ======
  const styles = {
    container: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      background: "#f3f4f6", // light gray
      padding: 16,
    },
    card: {
      width: "100%",
      maxWidth: 860,
      background: "#fff",
      borderRadius: 12,
      padding: 20,
      boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    },
    headingNetwork: {
      fontSize: 26,
      fontWeight: "700",
      color: "#0b5cff",
      textAlign: "center",
      marginBottom: 8,
    },
    subHeading: { fontSize: 20, fontWeight: 600, textAlign: "center", marginBottom: 12 },
    input: { width: "100%", padding: "12px 14px", margin: "6px 0", borderRadius: 10, border: "1px solid #d1d5db", fontSize: 16 },
    textarea: { width: "100%", minHeight: 90, padding: "10px 12px", margin: "8px 0", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 15 },
    btnPrimary: { padding: "10px 14px", background: "#0b5cff", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 16 },
    btnDanger: { padding: "8px 10px", background: "#ef4444", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, marginLeft: 8 },
    smallBtn: { padding: "6px 8px", background: "#06b6d4", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, marginLeft: 8 },
    cardBox: { background: "#f8fafc", padding: 10, borderRadius: 8, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" },
    labelBold: { fontWeight: 700 },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* شاشة تسجيل الدخول */}
        {step === "login" && (
          <div>
            <div style={styles.headingNetwork}>شبكة سلطان نت</div>
            <div style={styles.subHeading}>تسجيل الدخول</div>

            <input placeholder="اسم المستخدم" style={styles.input} value={username} onChange={(e) => setUsername(e.target.value)} />
            <input placeholder="كلمة السر" type="password" style={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} />

            <button style={{ ...styles.btnPrimary, width: "100%", marginTop: 10 }} onClick={handleLogin}>
              دخول
            </button>
          </div>
        )}

        {/* لوحة المستخدم */}
        {step === "dashboard" && loggedIn && (
          <div>
            <div style={styles.headingNetwork}>شبكة سلطان نت</div>
            <div style={{ ...styles.subHeading, textAlign: "center" }}>مرحبا، <span style={{ color: "#0b5cff" }}>{username}</span></div>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 15 }}>ملاحظة: الكروت الخاصة بك</div>
              <div style={{ fontSize: 15 }}><span style={styles.labelBold}>رصيدك:</span> {balance}</div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ ...styles.cardBox }}>
                <div>
                  <div style={{ fontWeight: 700 }}>الكروت المتوفرة</div>
                  <div style={{ fontSize: 13, color: "#6b7280" }}>الكروت المتوفرة أبو {cardValue} ريال فقط</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700 }}>{users[username] ? users[username].issuedCards.length : 0}</div>
                  <div style={{ fontSize: 13, color: "#6b7280" }}>عدد الكروت</div>
                </div>
              </div>
            </div>

            {card ? (
              <div>
                <div style={{ background: "#eef2ff", padding: 12, borderRadius: 8, marginBottom: 8, fontFamily: "monospace" }}>{card}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={styles.btnPrimary} onClick={handleCopyAndHide}>نسخ الكرت وإخفاء</button>
                  <button
                    style={{ ...styles.smallBtn, background: "#6b7280" }}
                    onClick={() => {
                      setCard(null);
                    }}
                  >
                    إخفاء بدون نسخ
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <button style={{ ...styles.btnPrimary, width: 200 }} onClick={handleRequestCard}>اطلب كرت</button>
                <button
                  style={{ ...styles.smallBtn, background: "#10b981", marginLeft: 10 }}
                  onClick={() => {
                    // زر خروج سريع للمستخدم
                    setStep("login");
                    setLoggedIn(false);
                    setUsername("");
                    setPassword("");
                    setCard(null);
                  }}
                >
                  تسجيل خروج
                </button>
              </div>
            )}
          </div>
        )}

        {/* لوحة الإدارة */}
        {step === "adminDashboard" && (
          <div>
            <div style={styles.headingNetwork}>شبكة سلطان نت</div>
            <div style={{ ...styles.subHeading, marginBottom: 6 }}>لوحة التحكم</div>

            <div style={{ marginBottom: 10 }}>
              <input placeholder="بحث عن عميل..." style={styles.input} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            <div style={{ borderTop: "1px solid #e6e9ef", paddingTop: 12, marginTop: 8 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>إضافة مستخدم جديد</div>
              <input placeholder="اسم المستخدم" style={styles.input} value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
              <input placeholder="كلمة السر" style={styles.input} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <input placeholder="الرصيد" type="number" style={styles.input} value={newBalance} onChange={(e) => setNewBalance(e.target.value)} />
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button style={styles.btnPrimary} onClick={handleAddUser}>إضافة</button>
                <button style={{ ...styles.smallBtn, background: "#6b7280" }} onClick={() => { setNewUsername(""); setNewPassword(""); setNewBalance(""); }}>تفريغ الحقول</button>
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>إدارة العملاء</div>

              {filteredUsers.length === 0 && <div style={{ color: "#6b7280" }}>لا يوجد عملاء مطابقين لبحثك.</div>}

              {filteredUsers.map((u) => (
                <div key={u} style={{ borderBottom: "1px solid #e6e9ef", padding: "10px 0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{u}</div>
                      <div style={{ fontSize: 13, color: "#6b7280" }}>الرصيد: {users[u].balance} - عدد الكروت: {users[u].issuedCards.length}</div>
                    </div>

                    <div>
                      <button style={styles.smallBtn} onClick={() => handleEditBalance(u)}>تعديل الرصيد</button>
                      <button style={styles.btnDanger} onClick={() => handleDeleteUser(u)}>حذف</button>
                    </div>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>إضافة عدة كروت دفعة واحدة (كل كرت سطر جديد)</div>
                    <textarea placeholder="أدخل الكروت: كل كرت في سطر" style={styles.textarea} value={newCards} onChange={(e) => setNewCards(e.target.value)} />
                    <div style={{ marginTop: 6 }}>
                      <button style={styles.btnPrimary} onClick={() => handleAddCardsToUser(u)}>إضافة الكروت</button>
                      <button style={{ ...styles.smallBtn, background: "#6b7280", marginLeft: 8 }} onClick={() => setNewCards("")}>تفريغ</button>
                    </div>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>قائمة الكروت</div>

                    {users[u].issuedCards && users[u].issuedCards.length > 0 ? (
                      users[u].issuedCards.map((c, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                          <div style={{ fontFamily: "monospace" }}>{c}</div>
                          <div>
                            {editCardIndex && editCardIndex.user === u && editCardIndex.index === i ? (
                              <>
                                <input style={{ ...styles.input, display: "inline-block", width: 260 }} value={editCardValue} onChange={(e) => setEditCardValue(e.target.value)} />
                                <button style={{ ...styles.smallBtn, marginLeft: 8 }} onClick={handleSaveCardEdit}>حفظ</button>
                                <button style={{ ...styles.smallBtn, background: "#6b7280", marginLeft: 8 }} onClick={() => { setEditCardIndex(null); setEditCardValue(""); }}>إلغاء</button>
                              </>
                            ) : (
                              <>
                                <button style={{ ...styles.smallBtn }} onClick={() => handleEditCard(u, i)}>تعديل</button>
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ color: "#6b7280" }}>لا توجد كروت</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12 }}>
              <button style={styles.smallBtn} onClick={() => { setStep("login"); setUsername(""); setPassword(""); }}>العودة لتسجيل الدخول</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
