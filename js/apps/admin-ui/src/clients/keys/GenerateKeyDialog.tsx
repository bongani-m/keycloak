import type KeyStoreConfig from "@keycloak/keycloak-admin-client/lib/defs/keystoreConfig";
import { HelpItem, SelectControl } from "@keycloak/keycloak-ui-shared";
import {
  Button,
  ButtonVariant,
  FileUpload,
  Form,
  FormGroup,
  Content,
} from "@patternfly/react-core";
import { Modal, ModalVariant } from "@patternfly/react-core/deprecated";
import { useState } from "react";
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useServerInfo } from "../../context/server-info/ServerInfoProvider";
import { StoreSettings } from "./StoreSettings";

type GenerateKeyDialogProps = {
  clientId: string;
  toggleDialog: () => void;
  save: (keyStoreConfig: KeyStoreConfig) => void;
};

type KeyFormProps = {
  useFile?: boolean;
  isSaml?: boolean;
  hasPem?: boolean;
};

const CERT_PEM = "Certificate PEM" as const;

const extensions = new Map([
  ["PKCS12", "p12"],
  ["JKS", "jks"],
  ["BCFKS", "bcfks"],
]);

type FormFields = KeyStoreConfig & {
  file: string | File;
};

export const getFileExtension = (format: string) => extensions.get(format);

export const KeyForm = ({
  isSaml = false,
  hasPem = false,
  useFile = false,
}: KeyFormProps) => {
  const { t } = useTranslation();

  const [filename, setFilename] = useState<string>();

  const { control, watch } = useFormContext<FormFields>();
  const format = watch("format");

  const { cryptoInfo } = useServerInfo();
  const supportedKeystoreTypes = [
    ...(cryptoInfo?.supportedKeystoreTypes ?? []),
    ...(hasPem ? [CERT_PEM] : []),
  ];

  return (
    <Form className="pf-v6-u-pt-lg">
      <SelectControl
        name="format"
        label={t("archiveFormat")}
        labelIcon={t("archiveFormatHelp")}
        controller={{
          defaultValue: supportedKeystoreTypes[0],
        }}
        menuAppendTo="parent"
        options={supportedKeystoreTypes}
      />
      {useFile && (
        <FormGroup
          label={t("importFile")}
          labelHelp={
            <HelpItem
              helpText={t("importFileHelp")}
              fieldLabelId="importFile"
            />
          }
          fieldId="importFile"
        >
          <Controller
            name="file"
            defaultValue=""
            control={control}
            render={({ field }) => (
              <FileUpload
                id="importFile"
                value={field.value}
                filename={filename}
                browseButtonText={t("browse")}
                onTextChange={(value) => {
                  field.onChange(value);
                }}
                onFileInputChange={(_, file) => setFilename(file.name)}
              />
            )}
          />
        </FormGroup>
      )}
      {format !== CERT_PEM && (
        <StoreSettings hidePassword={useFile} isSaml={isSaml} />
      )}
    </Form>
  );
};

export const GenerateKeyDialog = ({
  clientId,
  save,
  toggleDialog,
}: GenerateKeyDialogProps) => {
  const { t } = useTranslation();
  const form = useForm<KeyStoreConfig>({
    defaultValues: { keyAlias: clientId },
    mode: "onChange",
  });

  const {
    handleSubmit,
    formState: { isValid },
  } = form;

  return (
    <Modal
      variant={ModalVariant.medium}
      title={t("generateKeys")}
      isOpen
      onClose={toggleDialog}
      actions={[
        <Button
          id="modal-confirm"
          key="confirm"
          data-testid="confirm"
          isDisabled={!isValid}
          onClick={() => {
            handleSubmit((config) => {
              save(config);
              toggleDialog();
            })();
          }}
        >
          {t("generate")}
        </Button>,
        <Button
          id="modal-cancel"
          key="cancel"
          data-testid="cancel"
          variant={ButtonVariant.link}
          onClick={() => {
            toggleDialog();
          }}
        >
          {t("cancel")}
        </Button>,
      ]}
    >
      <Content>
        <Content component="p">{t("generateKeysDescription")}</Content>
      </Content>
      <FormProvider {...form}>
        <KeyForm />
      </FormProvider>
    </Modal>
  );
};
