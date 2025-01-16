// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract EthicalSourcing is AccessControl, Pausable, ReentrancyGuard {
    using Counters for Counters.Counter;

    bytes32 public constant ASSESSOR_ROLE = keccak256("ASSESSOR_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");

    Counters.Counter private _assessmentIds;

    struct EthicalAssessment {
        uint256 id;
        uint256 productId;
        address assessor;
        uint256 timestamp;
        string category;
        uint256 score;
        string evidence;
    }

    struct Audit {
        address auditor;
        uint256 timestamp;
        string findings;
        bool passed;
    }

    mapping(uint256 => EthicalAssessment) private _assessments;
    mapping(uint256 => Audit[]) private _audits;
    mapping(uint256 => uint256[]) private _productAssessments;

    event AssessmentCreated(uint256 indexed assessmentId, uint256 indexed productId, address indexed assessor);
    event AssessmentUpdated(uint256 indexed assessmentId, uint256 newScore);
    event AuditPerformed(uint256 indexed assessmentId, address indexed auditor, bool passed);

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function createAssessment(
        uint256 productId,
        string memory category,
        uint256 score,
        string memory evidence
    ) 
        external 
        onlyRole(ASSESSOR_ROLE) 
        whenNotPaused 
        returns (uint256)
    {
        require(score >= 0 && score <= 100, "Score must be between 0 and 100");

        _assessmentIds.increment();
        uint256 newAssessmentId = _assessmentIds.current();

        EthicalAssessment memory newAssessment = EthicalAssessment({
            id: newAssessmentId,
            productId: productId,
            assessor: msg.sender,
            timestamp: block.timestamp,
            category: category,
            score: score,
            evidence: evidence
        });

        _assessments[newAssessmentId] = newAssessment;
        _productAssessments[productId].push(newAssessmentId);

        emit AssessmentCreated(newAssessmentId, productId, msg.sender);

        return newAssessmentId;
    }

    function updateAssessment(
        uint256 assessmentId,
        uint256 newScore,
        string memory newEvidence
    ) 
        external 
        onlyRole(ASSESSOR_ROLE) 
        whenNotPaused 
    {
        require(_assessments[assessmentId].assessor == msg.sender, "Not the original assessor");
        require(newScore >= 0 && newScore <= 100, "Score must be between 0 and 100");

        _assessments[assessmentId].score = newScore;
        _assessments[assessmentId].evidence = newEvidence;
        _assessments[assessmentId].timestamp = block.timestamp;

        emit AssessmentUpdated(assessmentId, newScore);
    }

    function performAudit(
        uint256 assessmentId,
        string memory findings,
        bool passed
    ) 
        external 
        onlyRole(AUDITOR_ROLE) 
        whenNotPaused 
    {
        Audit memory newAudit = Audit({
            auditor: msg.sender,
            timestamp: block.timestamp,
            findings: findings,
            passed: passed
        });

        _audits[assessmentId].push(newAudit);

        emit AuditPerformed(assessmentId, msg.sender, passed);
    }

    function getAssessment(uint256 assessmentId) 
        external 
        view 
        returns (
            uint256 id,
            uint256 productId,
            address assessor,
            uint256 timestamp,
            string memory category,
            uint256 score,
            string memory evidence
        ) 
    {
        EthicalAssessment memory assessment = _assessments[assessmentId];
        return (
            assessment.id,
            assessment.productId,
            assessment.assessor,
            assessment.timestamp,
            assessment.category,
            assessment.score,
            assessment.evidence
        );
    }

    function getProductAssessments(uint256 productId) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return _productAssessments[productId];
    }

    function getAudits(uint256 assessmentId) 
        external 
        view 
        returns (Audit[] memory) 
    {
        return _audits[assessmentId];
    }

    function calculateEthicalScore(uint256 productId) 
        external 
        view 
        returns (uint256) 
    {
        uint256[] memory assessmentIds = _productAssessments[productId];
        require(assessmentIds.length > 0, "No assessments for this product");

        uint256 totalScore = 0;
        uint256 totalWeight = 0;

        for (uint256 i = 0; i < assessmentIds.length; i++) {
            EthicalAssessment memory assessment = _assessments[assessmentIds[i]];
            uint256 weight = block.timestamp - assessment.timestamp;
            totalScore += assessment.score * weight;
            totalWeight += weight;
        }

        return totalScore / totalWeight;
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
