import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../../styles/loan/customerLoan/CustomerLoan.css";

function ApplyLoanForm() {
  const employmentOptions = [
    "Software (IT)",
    "Software (Non-IT)",
    "Entrepreneur",
    "Farming / Agriculture",
    "Government Employee",
    "Self-Employed / Freelancer",
    "Student",
    "Healthcare / Medical",
    "Education / Teaching",
    "Other",
  ];

  const incomeRanges = [
    "N/A",
    "< ₹30,000",
    "₹30,000 - ₹70,000",
    "₹70,001 - ₹1,00,000",
    "> ₹1,00,000",
  ];

  const initialFormData = {
    loanTypeId: "",
    loanAmount: "",
    tenureYears: "",
    loanPurpose: "",
    income: "",
    employmentInfo: "",
    aadhaar: "",
    pan: "",
    previousActiveLoans: 0,
    cibilScore: "",
    expectedEmi: "",
  };

  const formatCurrency = (value) => {
    if (!value) return "";
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    let lastThree = digits.slice(-3);
    let otherNumbers = digits.slice(0, -3);
    if (otherNumbers !== "") lastThree = "," + lastThree;
    return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
  };

  const parseCurrency = (value) => value.replace(/,/g, "");

  // Calculate CIBIL score (same as your existing logic)
  const calculateCibilScore = (
    employmentInfo,
    incomeRange,
    loanPurpose,
    previousActiveLoans,
    loanAmount,
    tenureYears,
    loanTypeName
  ) => {
    let score = 300;

    // 🎯 Employment Mapping
    const employmentPointsMap = {
      "Software (IT)": 250,
      "Software (Non-IT)": 220,
      Entrepreneur: 180,
      "Farming / Agriculture": 150,
      "Government Employee": 230,
      "Self-Employed / Freelancer": 160,
      Student: 80,
      "Healthcare / Medical": 210,
      "Education / Teaching": 190,
      Other: 140,
    };
    score += employmentPointsMap[employmentInfo] ?? 140;

    // 💰 Income Mapping
    const incomePointsMap = {
      "> ₹1,00,000": 300,
      "₹70,001 - ₹1,00,000": 260,
      "₹30,000 - ₹70,000": 200,
      "< ₹30,000": 130,
      "N/A": 80,
    };
    score += incomePointsMap[incomeRange] ?? 130;

    // 📝 Loan Purpose Analysis
    const keywords = ["education", "medical", "business", "home", "travel", "wedding"];
    const purposeLength = loanPurpose?.trim()?.length || 0;
    const keywordMatch = keywords.some((k) =>
      loanPurpose.toLowerCase().includes(k)
    );
    score += Math.min(purposeLength, 50); // Cap length contribution at 50
    if (keywordMatch) score += 30;

    // 🪙 Loan Type Weighting
    if (loanTypeName?.toLowerCase().includes("gold")) score += 30;
    else if (loanTypeName?.toLowerCase().includes("personal")) score -= 20;

    // 🧮 Loan Amount Adjustments
    if (loanAmount < 25000) score += 20;
    if (incomeRange === "< ₹30,000" && loanAmount > 100000) score -= 50;

    // ⏳ Tenure Penalty
    if (tenureYears >= 10) score -= 30;
    else if (tenureYears >= 5) score -= 10;

    // 📉 Previous Active Loan Deduction (max 3)
    if (previousActiveLoans === 1) score -= 20;
    else if (previousActiveLoans === 2) score -= 35;
    else if (previousActiveLoans === 3) score -= 50;

    // ✅ Clamp score
    return Math.max(300, Math.min(900, Math.round(score)));
  };
  
  


  const [formData, setFormData] = useState(initialFormData);
  const [loanTypes, setLoanTypes] = useState([]);
  
  const [showModal, setShowModal] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  
  const [activeLoanCounts, setActiveLoanCounts] = useState({});

  // Fetch loan types on mount
  useEffect(() => {
    fetch("http://localhost:8081/api/loan-types")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch loan types");
        }
        return res.json();
      })
      .then((data) => {
        const mappedLoanTypes = data.map((lt) => ({
          ...lt,
          loanTypeId: lt.loan_type_id ?? lt.id ?? lt.loanTypeId ?? -1,
          maxLoanAmount: Number(lt.max_loan_amount ?? lt.maxLoanAmount ?? 0),
          maxTenureYears: Number(lt.max_tenure_years ?? lt.maxTenureYears ?? 30),
          maxLoansPerCustomerPerLoanType:
            lt.max_loans_per_customer_per_loan_type ??
            lt.maxLoansPerCustomerPerLoanType ??
            3,
          interestRate: Number(lt.interest_rate ?? lt.interestRate ?? 0),
        }));

        const validLoanTypes = mappedLoanTypes.filter((lt) => lt.loanTypeId !== -1);
        setLoanTypes(validLoanTypes);

        // ✅ Set loanTypeId to "" to make "Select Loan Type" default
        setFormData((prev) => ({
          ...prev,
          loanTypeId: "",
        }));
      })
      .catch((error) => {
        toast.error("Failed to load loan types");
      });
    }, []);


  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("http://localhost:8081/api/customer/loans/active-loan-counts", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch active loan counts");
        return res.json();
      })
      .then((data) => {
        setActiveLoanCounts(data); // ✅ THIS LINE is what eliminates the warning
      })
      .catch(() => toast.error("Failed to fetch active loan counts"));

  },[formData.loanTypeId]);



  const handleChange = (e) => {
    const { name, value } = e.target;

  if (name === "loanTypeId") {
    const selectedId = Number(value);
    const selectedLoanType = loanTypes.find((lt) => lt.loanTypeId === selectedId);
    const count = activeLoanCounts[selectedId] ?? 0;
    const maxAllowed = selectedLoanType?.maxLoansPerCustomerPerLoanType ?? 3;

    if (count >= maxAllowed) {
      toast.error(`You can only apply for ${maxAllowed} active ${selectedLoanType?.name} loan(s).`);
      setFormData((prev) => ({
        ...prev,
        loanTypeId: "",
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: selectedId,
      loanAmount: "",
      tenureYears: "",
    }));
    return;
  }




    if (name === "loanAmount") {
      const numericValue = parseCurrency(value);

      const selectedLoanType = loanTypes.find(
        (lt) => lt.loanTypeId === formData.loanTypeId
      );
      const maxLoanAmount = selectedLoanType
        ? selectedLoanType.maxLoanAmount
        : 1000000000;

      // Block if exceeds max
      if (maxLoanAmount !== undefined && Number(numericValue) > maxLoanAmount) return;

      if (/^\d*$/.test(numericValue)) {
        setFormData((prev) => ({
          ...prev,
          loanAmount: formatCurrency(value),
        }));
      }
      return;
    }



    if (name === "tenureYears") {
      if (/^\d{0,2}$/.test(value)) {
        const selectedLoanType = loanTypes.find(
          (lt) => lt.loanTypeId === formData.loanTypeId
        );
        const maxTenureYears = selectedLoanType
          ? selectedLoanType.maxTenureYears
          : 30;

        if (Number(value) > maxTenureYears) return; // Block if exceeds max

        setFormData((prev) => ({ ...prev, [name]: value }));
      }
      return;
    }

    if (name === "pan") {
      setFormData((prev) => ({
        ...prev,
        [name]: value.toUpperCase(),
      }));
      return;
    }

    if (name === "aadhaar") {
      if (/^\d{0,12}$/.test(value)) {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
      return;
    }
    
    if (name === "cibilScore") {
      if (/^\d{0,3}$/.test(value)) {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
      return;
    }



    if (name === "employmentInfo") {
      if (value === "Student") {
        setFormData((prev) => ({
          ...prev,
          employmentInfo: value,
          income: "N/A",
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          employmentInfo: value,
          income: "",
        }));
      }
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
  const selectedLoanType = loanTypes.find(
    (lt) => lt.loanTypeId === formData.loanTypeId
  );

  if (!formData.employmentInfo || !formData.income || !formData.loanPurpose) {
    setFormData((prev) => ({ ...prev, cibilScore: "" }));
    return;
  }

  const numericLoanAmount = parseInt(parseCurrency(formData.loanAmount)) || 0;

  const score = calculateCibilScore(
    formData.employmentInfo,
    formData.income,
    formData.loanPurpose,
    activeLoanCounts[formData.loanTypeId] || 0,
    numericLoanAmount,
    Number(formData.tenureYears),
    selectedLoanType?.name || ""
  );

  setFormData((prev) => ({ ...prev, cibilScore: score.toString() }));
  

  // 💡 EMI Calculation Logic
  const interestRate = selectedLoanType?.interestRate ?? 0;
  const principal = numericLoanAmount;
  const months = Number(formData.tenureYears) * 12;

  if (principal > 0 && interestRate > 0 && months > 0) {
    const monthlyRate = interestRate / 12 / 100;
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
                (Math.pow(1 + monthlyRate, months) - 1);
    const estimatedEmi = emi.toFixed(2);

    setFormData((prev) => ({
      ...prev,
      expectedEmi: `₹${Number(estimatedEmi).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`,
    }));


  } else {
    setFormData((prev) => ({ ...prev, expectedEmi: "" }));
  }


  
}, [
  formData.employmentInfo,
  formData.income,
  formData.loanPurpose,
  formData.loanAmount,
  formData.tenureYears,
  formData.loanTypeId,
  activeLoanCounts,
  loanTypes
]);



  const validate = () => {
  let errors = [];

  // ✅ Loan Type must be selected
  if (!formData.loanTypeId || isNaN(Number(formData.loanTypeId))) {
    toast.error("Please select a Loan Type.");
    return false;
  }

  const selectedLoanType = loanTypes.find(
    (lt) => lt.loanTypeId === Number(formData.loanTypeId)
  );
  
  
  const maxLoanAmount = selectedLoanType
    ? selectedLoanType.maxLoanAmount
    : Infinity;
  const maxTenureYears = selectedLoanType
    ? selectedLoanType.maxTenureYears
    : 30;

  const numericLoanAmount = parseInt(parseCurrency(formData.loanAmount));

  if (!formData.loanAmount || numericLoanAmount < 20000) {
    errors.push("Loan amount must be at least ₹20,000");
  } else if (numericLoanAmount > maxLoanAmount) {
    errors.push(`Loan amount cannot exceed ₹${maxLoanAmount.toLocaleString()}`);
  }

  if (
    !formData.tenureYears ||
    Number(formData.tenureYears) < 1 ||
    Number(formData.tenureYears) > maxTenureYears
  ) {
    errors.push(`Tenure must be between 1 and ${maxTenureYears} years`);
  }

  const loanPurposeTrimmed = formData.loanPurpose.trim();
  if (loanPurposeTrimmed.length < 3 || loanPurposeTrimmed.length > 100) {
    errors.push("Purpose must be between 3 and 100 characters");
  }

  const htmlTagRegex = /<\/?[^>]+(>|$)/g;
  if (htmlTagRegex.test(loanPurposeTrimmed)) {
    errors.push("Purpose cannot contain HTML tags");
  }

  const employmentInfoTrimmed = formData.employmentInfo.trim();
  if (!employmentInfoTrimmed) {
    errors.push("Please select your Employment Info");
  } else if (!employmentOptions.includes(employmentInfoTrimmed)) {
    errors.push("Invalid Employment Info selection");
  }

  if (employmentInfoTrimmed === "Student") {
    if (formData.income !== "N/A") {
      errors.push("For Students, Monthly Income should be 'N/A'");
    }
  } else {
    if (!incomeRanges.includes(formData.income) || formData.income === "N/A") {
      errors.push("Please select a valid Monthly Income");
    }
  }

  const aadhaarTrimmed = formData.aadhaar.trim();
  if (!/^\d{12}$/.test(aadhaarTrimmed)) {
    errors.push("Aadhaar must be exactly 12 digits");
  }

  const panTrimmed = formData.pan.trim();
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panTrimmed)) {
    errors.push("PAN format is invalid");
  }

  if (formData.previousActiveLoans === "") {
    errors.push("Please enter Previous Active Loans (0 if none)");
  } else if (
    !Number.isInteger(Number(formData.previousActiveLoans)) ||
    Number(formData.previousActiveLoans) < 0 ||
    Number(formData.previousActiveLoans) > 3
  ) {
    errors.push("Previous loans must be a non-negative integer (max 3)");
  }

  if (!formData.cibilScore) {
    errors.push("CIBIL Score is required");
  } else if (
    !Number.isInteger(Number(formData.cibilScore)) ||
    Number(formData.cibilScore) < 300 ||
    Number(formData.cibilScore) > 900
  ) {
    errors.push("CIBIL Score must be an integer between 300 and 900");
  }

  if (errors.length === 0) {
    return true; // no errors
  } else if (errors.length > 3) {
    toast.error("Please fill all the required form details.");
    return false;
  } else {
    // show individual errors if 3 or less
    errors.forEach((err) => toast.error(err));
    return false;
  }
};


  const handleSubmit = (e) => {
  e.preventDefault();
  if (!validate()) return;

  const numericLoanAmount = parseInt(parseCurrency(formData.loanAmount));

  // ✅ FIX: define selectedLoanType here
  const selectedLoanType = loanTypes.find(
    (lt) => lt.loanTypeId === Number(formData.loanTypeId)
  );

  const payload = {
    loanTypeId: Number(formData.loanTypeId),
    loanTypeName: selectedLoanType?.name || "N/A",
    loanAmount: numericLoanAmount,
    loanDuration: Number(formData.tenureYears),
    loanPurpose: formData.loanPurpose.trim(),
    income: formData.income,
    employmentInfo: formData.employmentInfo.trim(),
    aadhaar: formData.aadhaar.trim(),
    pan: formData.pan.trim(),
    previousActiveLoans: Number(formData.previousActiveLoans),
    cibilScore: Number(formData.cibilScore),
    interestRate: selectedLoanType?.interestRate?.toFixed(2) || "N/A", // ✅ now safe
  };

  const token = localStorage.getItem("token");
  fetch("http://localhost:8081/api/customer/loans", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
    .then(async (res) => {
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to apply loan: ${res.status} ${errorText}`);
      }
      setSubmittedData(payload);
      setShowModal(true); // show modal popup
      setFormData(initialFormData);
    })
    .catch((err) => toast.error(err.message));
};

  
  
  
  
  const formatCurrencyDisplay = (value) => {
    if (value === undefined || value === null) return "N/A";
    // If value is a string, convert to Number first
    const num = typeof value === "string" ? Number(value) : value;
    if (isNaN(num)) return "N/A";
    return num.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };


  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        pauseOnHover={true}
        pauseOnFocusLoss={false}
      />
      
      {showModal && (
  <div className="modal-overlay" onClick={() => setShowModal(false)}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <h2>Application Submitted Successfully!</h2>

      {/* Highlight CIBIL Score with dynamic color */}
      <div
        className={`cibil-highlight ${
          submittedData.cibilScore < 550
            ? "cibil-red"
            : submittedData.cibilScore < 700
            ? "cibil-yellow"
            : "cibil-green"
        }`}
      >
        CIBIL Score: <span>{submittedData.cibilScore}</span>
      </div>


      <table className="modal-table">
        <tbody>
          <tr>
            <th>Loan Type:</th>
            <td>{submittedData.loanTypeName}</td>
          </tr>
          <tr>
            <th>Loan Amount:</th>
            <td>
              ₹
              {submittedData.loanAmount.toLocaleString("en-IN", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </td>
          </tr>
          <tr>
            <th>Tenure (years):</th>
            <td>{submittedData.loanDuration}</td>
          </tr>
          <tr>
            <th>Interest Rate:</th>
            <td>
              {submittedData.interestRate !== "N/A"
                ? `${submittedData.interestRate}%`
                : "N/A"}
            </td>
          </tr>
        </tbody>
      </table>

      <button className="close-btn" onClick={() => setShowModal(false)}>
        Close
      </button>
    </div>
  </div>
)}





      <form className="apply-loan-form" onSubmit={handleSubmit} noValidate>
        <h2>Apply For Loan</h2>

        <div className="left-column">
          <div className="form-group">
            <label htmlFor="loanTypeId">Loan Type</label>
            <select
              id="loanTypeId"
              name="loanTypeId"
              value={
                formData.loanTypeId !== undefined && formData.loanTypeId !== null
                  ? formData.loanTypeId.toString()
                  : ""
              }
              onChange={handleChange}
              required
            >
              <option value="">Select Loan Type</option>
              {loanTypes.map((type, index) => {
                const value =
                  type.loanTypeId !== undefined && type.loanTypeId !== null
                    ? type.loanTypeId.toString()
                    : `unknown-${index}`;
                return (
                  <option key={value} value={value}>
                    {type.name} - {type.interestRate?.toFixed(2)}%
                  </option>

                );
              })}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="loanAmount">Loan Amount (₹)</label>
            <input
              type="text"
              id="loanAmount"
              name="loanAmount"
              placeholder="Enter loan amount"
              value={formData.loanAmount}
              onChange={handleChange}
              required
            />
            
            <small>
              Min : ₹20,000 &nbsp;&nbsp;&nbsp;
              Max allowed : ₹
              {formatCurrencyDisplay(
                loanTypes.find((lt) => lt.loanTypeId === formData.loanTypeId)
                  ?.maxLoanAmount
              )}
            </small>

          </div>

          

          <div className="form-group">
            <label htmlFor="loanPurpose">Purpose</label>
            <input
              type="text"
              id="loanPurpose"
              name="loanPurpose"
              placeholder="Describe the purpose of the loan"
              value={formData.loanPurpose}
              onChange={handleChange}
              maxLength={100}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="pan">PAN Number</label>
            <input
              type="text"
              id="pan"
              name="pan"
              placeholder="Enter your PAN number"
              value={formData.pan}
              onChange={handleChange}
              maxLength="10"
              required
            />
          </div>

          <div className="form-group">
            <label>Active Loans </label>
            <input
              type="number"
              readOnly
              disabled
              value={activeLoanCounts[formData.loanTypeId] || 0}
            />
          </div>

        </div>

        <div className="right-column">
          <div className="form-group">
            <label htmlFor="employmentInfo">Employment Info</label>
            <select
              id="employmentInfo"
              name="employmentInfo"
              value={formData.employmentInfo}
              onChange={handleChange}
              required
            >
              <option value="">Select Employment Info</option>
              {employmentOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="tenureYears">Loan Tenure (Years)</label>
            <input
              type="number"
              id="tenureYears"
              name="tenureYears"
              placeholder="Enter tenure in years"
              value={formData.tenureYears}
              onChange={handleChange}
              min="1"
              max={
                loanTypes.find((lt) => lt.loanTypeId === formData.loanTypeId)
                  ?.maxTenureYears || 30
              }
              required
            />
            <small>
              Max allowed tenure:{" "}
              {loanTypes.find((lt) => lt.loanTypeId === formData.loanTypeId)
                ?.maxTenureYears ?? 30}{" "}
              years
            </small>

          </div>

          <div className="form-group">
            <label htmlFor="income">Monthly Income</label>
            <select
              id="income"
              name="income"
              value={formData.income}
              onChange={handleChange}
              required
              disabled={formData.employmentInfo === "Student"}
            >
              <option value="">Select Monthly Income</option>
              {incomeRanges.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            
          </div>

          <div className="form-group">
            <label htmlFor="aadhaar">Aadhaar Number</label>
            <input
              type="text"
              id="aadhaar"
              name="aadhaar"
              placeholder="Enter 12-digit Aadhaar number"
              value={formData.aadhaar}
              onChange={handleChange}
              maxLength="12"
              inputMode="numeric"
              required
            />
          </div>

          

          <div className="form-group">
            <label>Expected EMI</label>
            <input
              type="text"
              value={formData.expectedEmi ? `${formData.expectedEmi} / month` : ""}
              readOnly
              placeholder="EMI auto-calculated"
            />

          </div>


        </div>

        <div className="form-button-group">
          <button type="submit" className="btn-submit">
            Submit Application
          </button>
          <button
            type="button"
            className="btn-reset"
            onClick={() => setFormData(initialFormData)}
          >
            Reset Form
          </button>
        </div>
      </form>
    </>
  );
}

export default ApplyLoanForm;
