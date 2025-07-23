"use client";

import { PopupSpec, usePopup } from "@/components/admin/connectors/Popup";
import { Button } from "@/components/ui/button";
import Text from "@/components/ui/text";
import { triggerIndexing } from "./lib";
import { useState } from "react";
import { Modal } from "@/components/Modal";
import { Separator } from "@/components/ui/separator";
import { ConnectorCredentialPairStatus } from "./types";
import { getCCPairStatusMessage } from "@/lib/ccPair";

function ReIndexPopup({
  connectorId,
  credentialId,
  ccPairId,
  setPopup,
  hide,
}: {
  connectorId: number;
  credentialId: number;
  ccPairId: number;
  setPopup: (popupSpec: PopupSpec | null) => void;
  hide: () => void;
}) {
  return (
    <Modal title="Run Indexing" onOutsideClick={hide}>
      <div>
        <Button
          variant="submit"
          className="ml-auto"
          onClick={() => {
            triggerIndexing(
              false,
              connectorId,
              credentialId,
              ccPairId,
              setPopup
            );
            hide();
          }}
        >
          Run Update
        </Button>

        <Text className="mt-2">
          This will pull in and index all documents that have changed and/or
          have been added since the last successful indexing run.
        </Text>

        <Separator />

        <Button
          variant="submit"
          className="ml-auto"
          onClick={() => {
            triggerIndexing(
              true,
              connectorId,
              credentialId,
              ccPairId,
              setPopup
            );
            hide();
          }}
        >
          Run Complete Re-Indexing
        </Button>

        <Text className="mt-2">
          This will cause a complete re-indexing of all documents from the
          source.
        </Text>

        <Text className="mt-2">
          <b>NOTE:</b> depending on the number of documents stored in the
          source, this may take a long time.
        </Text>
      </div>
    </Modal>
  );
}

export function ReIndexButton({
  ccPairId,
  connectorId,
  credentialId,
  isIndexing,
  isDisabled,
  ccPairStatus,
}: {
  ccPairId: number;
  connectorId: number;
  credentialId: number;
  isIndexing: boolean;
  isDisabled: boolean;
  ccPairStatus: ConnectorCredentialPairStatus;
}) {
  const { popup, setPopup } = usePopup();
  const [reIndexPopupVisible, setReIndexPopupVisible] = useState(false);
  const [isPrioritizing, setIsPrioritizing] = useState(false);

  const handlePrioritize = async () => {
    setIsPrioritizing(true);
    try {
      const result = await triggerIndexing(
        false, // fromBeginning
        connectorId,
        credentialId,
        ccPairId,
        setPopup,
        true // highPriority
      );
      if (result.success) {
        setPopup({
          message: "Indexing job prioritized successfully!",
          type: "success",
        });
      } else {
        setPopup({
          message: result.message,
          type: "error",
        });
      }
    } catch (error) {
      setPopup({
        message: "Failed to prioritize indexing job",
        type: "error",
      });
    } finally {
      setIsPrioritizing(false);
    }
  };

  const isButtonDisabled = 
    isDisabled ||
    ccPairStatus == ConnectorCredentialPairStatus.DELETING ||
    ccPairStatus == ConnectorCredentialPairStatus.PAUSED ||
    ccPairStatus == ConnectorCredentialPairStatus.INVALID;

  return (
    <>
      {reIndexPopupVisible && (
        <ReIndexPopup
          connectorId={connectorId}
          credentialId={credentialId}
          ccPairId={ccPairId}
          setPopup={setPopup}
          hide={() => setReIndexPopupVisible(false)}
        />
      )}
      {popup}
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="min-w-[100px]"
          onClick={handlePrioritize}
          disabled={isButtonDisabled || isPrioritizing}
          tooltip={isButtonDisabled ? getCCPairStatusMessage(isDisabled, isIndexing, ccPairStatus) : "Trigger high-priority indexing job"}
        >
          {isPrioritizing ? "Prioritizing..." : "Prioritize"}
        </Button>
        <Button
          variant="success-reverse"
          className="min-w-[100px]"
          onClick={() => {
            setReIndexPopupVisible(true);
          }}
          disabled={isButtonDisabled}
          tooltip={getCCPairStatusMessage(isDisabled, isIndexing, ccPairStatus)}
        >
          Re-Index
        </Button>
      </div>
    </>
  );
}
