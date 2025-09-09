import { useEffect, useState } from "react";
import {
  FiCheckCircle,
  FiSend,
  FiXCircle,
  FiSearch,
  FiClock
} from "react-icons/fi";
import "../../../styles/loan/customerLoan/TrackStatusCard.css";

function TrackStatusCard({ loan }) {
  const [progressPercent, setProgressPercent] = useState(0);

  useEffect(() => {
    if (!loan) return;

    let percent = 0;
    switch (loan.loanStatus) {
      case "SUBMITTED":
        percent = 27;
        break;
      case "REJECTED":
        percent = 50;
        break;
      case "APPROVED":
        percent = 75;
        break;
      case "CLOSED":
        percent = 100;
        break;
      default:
        percent = 0;
    }
    setProgressPercent(percent);
  }, [loan]);

  if (!loan) return null;

  let approvalComment = "No decision comment available.";
  let decisionDate = null;

  if (loan.loanStatus === "CLOSED" || loan.loanStatus === "APPROVED") {
    // Only show approved comment
    const approvedEntry = loan.statusHistory?.find((s) => s.status === "APPROVED");
    if (approvedEntry) {
      approvalComment = approvedEntry.comments || "No approval comment available.";
      decisionDate = approvedEntry.updatedAt;
    }
  } else if (loan.loanStatus === "REJECTED") {
    // Only show rejected comment
    const rejectedEntry = loan.statusHistory?.find((s) => s.status === "REJECTED");
    if (rejectedEntry) {
      approvalComment = rejectedEntry.comments || "No rejection comment available.";
      decisionDate = rejectedEntry.updatedAt;
    }
  }


  // --- CLOSED comment (robust) ---
  const closedEntry = loan.statusHistory?.find(
    (s) => String(s.status || "").trim().toUpperCase() === "CLOSED"
  );

  const closedComment =
    String(loan.loanStatus || "").trim().toUpperCase() === "CLOSED"
      ? (closedEntry?.comments && closedEntry.comments.trim()
          ? closedEntry.comments
          : "You have paid all your EMIs, your loan has been cleared. Thank You")
      : "Loan is not closed yet.";



  const submittedDate = loan.submittedAt;
  // --- CLOSED date (robust + fallback) ---
  const closedDate =
    String(loan.loanStatus || "").trim().toUpperCase() === "CLOSED"
      ? (closedEntry?.updatedAt || loan.closedAt || null)
      : null;

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="track-status-modal-expanded">
      {/* Progress Bar */}
      <div className="track-status-modal-progress-wrapper">
        <div className="progress-container">
          {/* Track */}
          <div className="progress-track"></div>

          {/* Fill */}
          <div
            className={`progress-fill ${loan.loanStatus === "REJECTED" ? "rejected" : ""}`}
            style={{ width: `${progressPercent}%` }}
          ></div>

          {/* Steps */}
          {[0, 27, 50, 75, 100].map((pos, idx) => {
            const isRejected = idx === 2 && loan.loanStatus === "REJECTED";
            const isCompleted = pos <= progressPercent;

            // Dynamic label logic
            let labelText = "";
            if (idx === 2) {
              labelText = loan.loanStatus === "REJECTED" ? "REJECTED" : "APPROVED";
            } else {
              labelText = ["SUBMITTED", "UNDER REVIEW", "", "ONGOING", "CLOSED"][idx];
            }

            return (
              <div key={idx} className="progress-step" style={{ left: `${pos}%` }}>
                
                <div
                  className={`progress-icon ${
                    idx === 4 && loan.loanStatus === "CLOSED"
                      ? "closed-icon-blue"
                      : isRejected
                      ? "rejected"
                      : isCompleted
                      ? "completed"
                      : ""
                  }`}
                >

                  
                
                  
                  {idx === 0 && <FiSend />}
                  {idx === 1 && <FiSearch />}
                  {idx === 2 && (isRejected ? <FiXCircle /> : <FiCheckCircle />)}
                  {idx === 3 && <FiClock />}

                  {idx === 4 && (
                    <FiCheckCircle
                      className={loan.loanStatus === "CLOSED" ? "closed-icon-blue" : ""}
                    />
                  )}

                </div>
                
                
                <span className="progress-label">{labelText}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comments Section */}
      <div className="track-status-modal-comments-wrapper">
        <div className="track-status-modal-comment-col info-col">
          <div className="track-status-comment-header">📝 Submitted</div>
          <div className="track-status-comment-time">
            At : {formatDate(submittedDate)}
          </div>
          <p className="track-status-comment-message">
            Your loan application has been submitted successfully. Please wait while our team reviews your request.
          </p>
        </div>

        <div className="track-status-modal-comment-col decision-col">
          <div className="track-status-comment-header">
            {loan.loanStatus === "REJECTED"
              ? "❌ Rejection Comment"
              : "✅ Approval Comment"}
          </div>

          
          <div className="track-status-modal-comment-time">
            At : {formatDate(decisionDate)}
          </div>
          <p className="track-status-comment-message">{approvalComment}</p>

          
        </div>

        <div className="track-status-modal-comment-col closed-col">
          <div className="track-status-comment-header">🔒 Closed</div>
          <div className="track-status-comment-time">
            At : {formatDate(closedDate)}
          </div>
          <p className="track-status-comment-message">{closedComment}</p>
        </div>
      </div>
    </div>
  );
}

export default TrackStatusCard;
