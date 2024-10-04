import React, { useEffect, useState } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    Button,
    ModalFooter,
    Box,
    VStack,
    HStack,
    Text,
    IconButton,
    Editable,
    EditableInput,
    EditablePreview,
    useToast,
} from '@chakra-ui/react';
import { Icon } from "@iconify-icon/react";
import { insertFile, useDuckDb } from 'duckdb-wasm-kit';
import { snakeCase } from 'change-case';

interface FileWithTable {
    file: File;
    tableName: string;
}

interface UploadDataProps {
    disclosure: {
        isOpen: boolean;
        onOpen: () => void;
        onClose: () => void;
    };
    setUploadStatus: (status: 'idle' | 'loading' | 'done') => void;
    validFileTypes?: string[]
}


const defaultValidFileTypes = ['.csv', '.parquet', '.arrow'];
const UploadData: React.FC<UploadDataProps> = ({ disclosure, setUploadStatus, validFileTypes = defaultValidFileTypes }) => {
    const { db, loading, error } = useDuckDb();
    const { isOpen, onClose } = disclosure;
    const [files, setFiles] = useState<FileWithTable[]>([]);
    const toast = useToast();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const newFiles = Array.from(event.target.files).map(file => ({
                file,
                tableName: snakeCase(file.name.split(".")[0])
            }));
            setFiles(prevFiles => [...prevFiles, ...newFiles]);
        }
    };

    const handleUpload = async () => {
        if (!db) {
            console.error("No db during upload")
            return
        }
        if (files.length > 0) {
            console.log('Uploading files:', files.map(f => f.file.name));
            setUploadStatus('loading');
            onClose();

            try {
                await Promise.all(files.map(({ file, tableName }) => {
                    return insertFile(db, file, tableName);
                }))
                setUploadStatus('done');
                setTimeout(() => setUploadStatus('idle'), 3000);
            } catch (error) {
                toast({
                    title: "Error uploading files",
                    description: (error as any).message,
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
                setUploadStatus('idle');
            }
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files) {
            const newFiles = Array.from(e.dataTransfer.files).filter(file => {
                const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
                return validFileTypes.includes(fileExtension);
            });

            if (newFiles.length !== e.dataTransfer.files.length) {
                toast({
                    title: "Invalid file type",
                    description: `Some files were not added. The only supported file types are: ${validFileTypes.join(", ")}`,
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
            }

            const filesToAdd = newFiles.map(file => ({
                file,
                tableName: snakeCase(file.name.split(".")[0])
            }));
            setFiles(prevFiles => [...prevFiles, ...filesToAdd]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    };

    const updateTableName = (index: number, newName: string) => {
        setFiles(prevFiles => prevFiles.map((file, i) =>
            i === index ? { ...file, tableName: newName } : file
        ));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent maxWidth="60rem">
                <ModalHeader>Upload Data</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <Box
                        width="100%"
                        height="30rem"
                        bgColor="gray.100"
                        borderRadius="lg"
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        onDrop={handleDrop}
                        padding={4}
                    >
                        {files.length < 1 ? null : <HStack width="100%" justifyContent="space-between" mb={2}>
                            <Text fontWeight="bold" width="40%">File Name</Text>
                            <Text fontWeight="bold" width="40%">Table Name</Text>
                            <Box width="20%" /> {/* Spacer for the remove button */}
                        </HStack>}
                        <VStack spacing={4} width="100%" overflowY="auto">
                            {files.map(({ file, tableName }, index) => (
                                <HStack key={index} width="100%" justifyContent="space-between" bgColor="white" p={2} borderRadius="md">
                                    <Text width="40%" isTruncated>{file.name}</Text>
                                    <Editable
                                        defaultValue={tableName}
                                        onSubmit={(newName) => updateTableName(index, newName)}
                                        width="40%"
                                    >
                                        <EditablePreview width="100%" />
                                        <EditableInput width="100%" />
                                    </Editable>
                                    <Box width="20%" textAlign="right">
                                        <IconButton
                                            aria-label="Remove file"
                                            icon={<Icon icon="mdi:close" />}
                                            size="sm"
                                            onClick={() => removeFile(index)}
                                        />
                                    </Box>
                                </HStack>
                            ))}
                        </VStack>
                        <Box mt={4}>
                            <input
                                type="file"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                                id="fileInput"
                                multiple
                                accept={validFileTypes.join(",")}
                            />
                            <label htmlFor="fileInput">
                                <Button as="span" leftIcon={<Icon icon="mdi:plus" />}>
                                    Add Files
                                </Button>
                            </label>
                        </Box>
                        {files.length === 0 && (
                            <Text mt={4} color="gray.500">
                                Drag and drop CSV, Parquet, or Arrow files here, or click 'Add Files' to select files
                            </Text>
                        )}
                    </Box>
                </ModalBody>
                <ModalFooter>
                    <Button onClick={handleUpload} disabled={files.length === 0} mt={4}>
                        Upload
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default UploadData;