import React, { useEffect } from "react";
import "./modal.css";

function Modal({ setModal, modalData = [] }) {
  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setModal(false);
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [setModal]);

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="student-list-title" onClick={() => setModal(false)}>
      <section className="modal-panel" onClick={(event) => event.stopPropagation()}>
        <div className="modal-toolbar">
          <h2 id="student-list-title" className="modal-heading">学生列表</h2>
          <button className="button-6" type="button" onClick={() => setModal(false)}>
            返回
          </button>
        </div>

        <div className="modal-list">
          {modalData.length > 0 ? (
            modalData.map((data) => (
              <article className="modal-content" key={data.id}>
                <div className="modal-header">
                  <h3 className="modal-title">
                    {data.first_name} {data.second_name} {data.surname}
                  </h3>
                </div>
                <div className="modal-body">
                  <h4>学号：{data.admission_number}</h4>
                  <h4>年龄：{data.age}</h4>
                  <p>{data.description}</p>
                </div>
              </article>
            ))
          ) : (
            <p className="modal-empty">暂无学生信息</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default Modal;
